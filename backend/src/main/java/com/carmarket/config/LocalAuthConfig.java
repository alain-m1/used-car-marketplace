// backend/src/main/java/com/carmarket/config/LocalAuthConfig.java
package com.carmarket.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Offline stand-in for Cognito, active only with SPRING_PROFILES_ACTIVE=dev.
 * Tokens are HS256 JWTs signed with a local secret and verified by the same
 * resource-server filter chain, so @PreAuthorize rules behave as they do in AWS.
 * Replaces SecurityConfig.jwtDecoder(), which is limited to non-dev profiles.
 */
@Configuration
@Profile("dev")
public class LocalAuthConfig {

    static final String LOCAL_ISSUER = "car-marketplace-local";
    private static final String PLACEHOLDER_CLIENT_ID = "placeholder-client-id";

    private final SecretKey secretKey;

    public LocalAuthConfig(
            @Value("${app.auth.local.jwt-secret}") String secret,
            @Value("${aws.cognito.client-id}") String clientId) {
        // Safety net: the bypass only runs while the placeholder Cognito client is configured
        if (!PLACEHOLDER_CLIENT_ID.equals(clientId)) {
            throw new IllegalStateException(
                    "Local auth bypass requires aws.cognito.client-id=" + PLACEHOLDER_CLIENT_ID
                            + " (found '" + clientId + "'). Refusing to start.");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.auth.local.jwt-secret must be at least 32 bytes");
        }
        this.secretKey = new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    public JwtEncoder localJwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(LOCAL_ISSUER));
        decoder.setJwtValidator(validator);
        return decoder;
    }
}
