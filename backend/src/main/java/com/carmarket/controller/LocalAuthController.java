// backend/src/main/java/com/carmarket/controller/LocalAuthController.java
package com.carmarket.controller;

import com.carmarket.dto.UserDTO;
import com.carmarket.exception.UserAlreadyExistsException;
import com.carmarket.model.User;
import com.carmarket.model.UserRole;
import com.carmarket.repository.UserRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;

/**
 * Offline login/registration for local development (SPRING_PROFILES_ACTIVE=dev only).
 * Passwords are accepted but NOT checked: any credentials sign in. Unknown users are
 * created on the fly so the frontend always gets a real database user id back.
 */
@RestController
@Profile("dev")
@RequestMapping("/api/v1/auth")
public class LocalAuthController {

    private static final String SUB_PREFIX = "local-";

    private final UserRepository userRepository;
    private final JwtEncoder jwtEncoder;

    public LocalAuthController(UserRepository userRepository, JwtEncoder jwtEncoder) {
        this.userRepository = userRepository;
        this.jwtEncoder = jwtEncoder;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LocalAuthRequest {
        public String username;
        public String email;
        public String password;
        public String firstName;
        public String lastName;
        public String role;
        public String location;
        public String phoneNumber;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LocalAuthRequest request) {
        String identifier = firstNonBlank(request.email, request.username);
        if (identifier == null) {
            throw new IllegalArgumentException("username or email is required");
        }
        String key = identifier.trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(key)
                .or(() -> userRepository.findByUsername(key))
                .orElseGet(() -> userRepository.save(newLocalUser(request, key)));

        return ResponseEntity.ok(tokenResponse(user));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody LocalAuthRequest request) {
        if (isBlank(request.username) || isBlank(request.email)) {
            throw new IllegalArgumentException("username and email are required");
        }
        String username = request.username.trim();
        String email = request.email.trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException("Username already exists: " + username);
        }
        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("Email already exists: " + email);
        }

        User user = newLocalUser(request, email);
        user.setUsername(username);
        return ResponseEntity.ok(tokenResponse(userRepository.save(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    private User newLocalUser(LocalAuthRequest request, String emailOrUsername) {
        boolean isEmail = emailOrUsername.contains("@");
        String localPart = isEmail ? emailOrUsername.substring(0, emailOrUsername.indexOf('@')) : emailOrUsername;

        User user = new User();
        user.setUsername(!isBlank(request.username) && !request.username.contains("@")
                ? request.username.trim() : padUsername(localPart));
        user.setEmail(isEmail ? emailOrUsername : localPart + "@local.test");
        user.setFirstName(orDefault(request.firstName, capitalize(localPart)));
        user.setLastName(orDefault(request.lastName, "Local"));
        user.setLocation(orDefault(request.location, "Local Dev"));
        user.setPhoneNumber(isBlank(request.phoneNumber) ? null : request.phoneNumber.trim());
        user.setRole(resolveRole(request.role, localPart));
        user.setIsActive(true);
        return user;
    }

    private UserRole resolveRole(String requested, String localPart) {
        if (!isBlank(requested)) {
            try {
                return UserRole.valueOf(requested.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
                // fall through to name-based rule
            }
        }
        if (localPart.equals("admin")) {
            return UserRole.ADMIN;
        }
        return localPart.contains("seller") ? UserRole.SELLER : UserRole.SHOPPER;
    }

    private Map<String, Object> tokenResponse(User user) {
        // Make the Cognito "sub" lookup in SecurityConfig resolve to this user
        String sub = SUB_PREFIX + user.getUsername();
        if (!sub.equals(user.getCognitoUserId())) {
            user.setCognitoUserId(sub);
            user = userRepository.save(user);
        }

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("car-marketplace-local")
                .subject(sub)
                .issuedAt(now)
                .expiresAt(now.plus(24, ChronoUnit.HOURS))
                .claim("username", user.getUsername())
                .build();
        String token = jwtEncoder.encode(
                JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();

        return Map.of("token", token, "user", toDto(user));
    }

    private UserDTO toDto(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setLocation(user.getLocation());
        dto.setRole(user.getRole());
        dto.setIsActive(user.getIsActive());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    private static String padUsername(String s) {
        return s.length() >= 3 ? s : (s + "___").substring(0, 3);
    }

    private static String capitalize(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String orDefault(String s, String fallback) {
        return isBlank(s) ? fallback : s.trim();
    }

    private static String firstNonBlank(String a, String b) {
        return !isBlank(a) ? a : (!isBlank(b) ? b : null);
    }
}
