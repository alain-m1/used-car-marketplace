// backend/src/main/java/com/carmarket/config/SecurityConfig.java
package com.carmarket.config;

import com.carmarket.model.User;
import com.carmarket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Stateless JWT resource-server security for the marketplace API.
 *
 * <ul>
 *   <li>Public: GET on vehicle inventory ({@code /api/v1/cars/**}, {@code /api/v1/listings/**}),
 *       user registration and username/email availability checks, health and API docs.</li>
 *   <li>Authenticated: everything else (messages, profile updates, listing mutations, ...).</li>
 *   <li>Tokens: Cognito User Pool access tokens, validated against the pool's JWKS.</li>
 * </ul>
 *
 * Required property: {@code aws.cognito.user-pool-id} (e.g. us-east-2_AbCdEfGhI).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/api/v1/cars/**",
            "/api/v1/listings/**",
            "/api/v1/users/check/**"
    };

    private static final String[] PUBLIC_ENDPOINTS = {
            "/actuator/health/**",
            "/actuator/info",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    @Value("${aws.region:us-east-2}")
    private String awsRegion;

    @Value("${aws.cognito.user-pool-id}")
    private String userPoolId;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, UserRepository userRepository)
            throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
                        // New account registration
                        .requestMatchers(HttpMethod.POST, "/api/v1/users").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter(userRepository))));

        return http.build();
    }

    private String issuerUri() {
        return "https://cognito-idp." + awsRegion + ".amazonaws.com/" + userPoolId;
    }

    /**
     * Resolves signing keys lazily from the user pool JWKS (no network call at startup)
     * and validates issuer, expiry and that the token is a Cognito access token.
     */
    @Bean
    public JwtDecoder jwtDecoder() {
        String issuer = issuerUri();
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withJwkSetUri(issuer + "/.well-known/jwks.json")
                .build();

        OAuth2TokenValidator<Jwt> accessTokenOnly = jwt -> "access".equals(jwt.getClaimAsString("token_use"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Expected a Cognito access token", null));

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer), accessTokenOnly));
        return decoder;
    }

    /**
     * Builds the authentication for a validated Cognito JWT.
     *
     * <p>The Cognito {@code sub} UUID is matched against {@code users.cognito_user_id}. The resulting
     * {@link CognitoPrincipal} exposes the local database id as {@code id}, so existing expressions such as
     * {@code #userId == authentication.principal.id} compare Long to Long. {@code authentication.name}
     * is the {@code sub}. The database role is the single source of truth for authorities.
     */
    private Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter(UserRepository userRepository) {
        return jwt -> {
            String sub = jwt.getSubject();
            Optional<User> user = userRepository.findByCognitoUserId(sub);

            Long id = user.map(User::getId).orElse(null);
            String username = user.map(User::getUsername).orElse(jwt.getClaimAsString("username"));

            List<GrantedAuthority> authorities = new ArrayList<>();
            boolean active = user.map(u -> !Boolean.FALSE.equals(u.getIsActive())).orElse(true);
            if (active) {
                // Every signed-in account is a USER; ADMIN/SELLER/SHOPPER come from the stored role
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                user.ifPresent(u -> authorities.add(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())));
            }

            return new CognitoAuthenticationToken(jwt, new CognitoPrincipal(id, sub, username), authorities);
        };
    }

    /** Principal exposed to SpEL as {@code authentication.principal}. {@code id} is null until the user row is linked. */
    public static final class CognitoPrincipal {
        private final Long id;
        private final String sub;
        private final String username;

        public CognitoPrincipal(Long id, String sub, String username) {
            this.id = id;
            this.sub = sub;
            this.username = username;
        }

        public Long getId() {
            return id;
        }

        public String getSub() {
            return sub;
        }

        public String getUsername() {
            return username;
        }

        @Override
        public String toString() {
            return sub;
        }
    }

    public static final class CognitoAuthenticationToken extends AbstractAuthenticationToken {
        private final Jwt jwt;
        private final CognitoPrincipal principal;

        public CognitoAuthenticationToken(Jwt jwt, CognitoPrincipal principal,
                                          Collection<? extends GrantedAuthority> authorities) {
            super(authorities);
            this.jwt = jwt;
            this.principal = principal;
            setAuthenticated(true);
        }

        @Override
        public Object getCredentials() {
            return jwt;
        }

        @Override
        public Object getPrincipal() {
            return principal;
        }

        @Override
        public String getName() {
            return principal.getSub();
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
