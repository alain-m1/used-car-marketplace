// backend/src/main/java/com/carmarket/controller/UserController.java
package com.carmarket.controller;

import com.carmarket.dto.UserDTO;
import com.carmarket.model.UserRole;
import com.carmarket.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "APIs for managing users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Get user by ID", description = "Retrieve a user by their ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User found successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long id) {
        logger.info("GET /api/v1/users/{} - Fetching user by ID", id);
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Get user by username", description = "Retrieve a user by their username")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User found successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDTO> getUserByUsername(
            @Parameter(description = "Username", required = true)
            @PathVariable String username) {
        logger.info("GET /api/v1/users/username/{} - Fetching user by username", username);
        UserDTO user = userService.getUserByUsername(username);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Get all users", description = "Retrieve all users with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/users - Fetching all users with pagination");
        Page<UserDTO> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Get active users", description = "Retrieve all active users with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Active users retrieved successfully")
    })
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserDTO>> getActiveUsers(
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/users/active - Fetching active users");
        Page<UserDTO> users = userService.getActiveUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Get users by role", description = "Retrieve users by their role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully")
    })
    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserDTO>> getUsersByRole(
            @Parameter(description = "User role", required = true)
            @PathVariable UserRole role,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/users/role/{} - Fetching users by role", role);
        Page<UserDTO> users = userService.getUsersByRole(role, pageable);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Search users", description = "Search users by name, username, or email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
    })
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserDTO>> searchUsers(
            @Parameter(description = "Search term", required = true)
            @RequestParam String q,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/users/search?q={} - Searching users", q);
        Page<UserDTO> users = userService.searchUsers(q, pageable);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Get the signed-in user", description = "Profile row linked to the Cognito sub of the access token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "404", description = "No profile linked to this Cognito user yet")
    })
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.getUserByCognitoId(authentication.getName()));
    }

    @Operation(summary = "Create a new user", description = "Create a new user account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "User already exists")
    })
    @PostMapping
    public ResponseEntity<UserDTO> createUser(
            @Parameter(description = "User data", required = true)
            @Valid @RequestBody UserDTO userDTO,
            Authentication authentication) {
        // Requires a valid Cognito access token; the profile is linked to its `sub`.
        logger.info("POST /api/v1/users - Creating profile with username: {}", userDTO.getUsername());
        UserDTO createdUser = userService.createUserForCognito(userDTO, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @Operation(summary = "Update user", description = "Update an existing user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<UserDTO> updateUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long id,
            @Parameter(description = "Updated user data", required = true)
            @Valid @RequestBody UserDTO userDTO,
            Authentication authentication) {
        logger.info("PUT /api/v1/users/{} - Updating user", id);
        // Only an admin may change a role or activate/deactivate an account; ignore those fields for everyone else.
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin) {
            userDTO.setRole(null);
            userDTO.setIsActive(null);
        }
        UserDTO updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Deactivate user", description = "Deactivate a user account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "User deactivated successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long id) {
        logger.info("PATCH /api/v1/users/{}/deactivate - Deactivating user", id);
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Activate user", description = "Activate a user account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "User activated successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> activateUser(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long id) {
        logger.info("PATCH /api/v1/users/{}/activate - Activating user", id);
        userService.activateUser(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Check username availability", description = "Check if a username is available")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Username availability checked")
    })
    @GetMapping("/check/username/{username}")
    public ResponseEntity<Map<String, Boolean>> checkUsernameAvailability(
            @Parameter(description = "Username to check", required = true)
            @PathVariable String username) {
        logger.info("GET /api/v1/users/check/username/{} - Checking username availability", username);
        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(Map.of("available", !exists));
    }

    @Operation(summary = "Check email availability", description = "Check if an email is available")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email availability checked")
    })
    @GetMapping("/check/email/{email}")
    public ResponseEntity<Map<String, Boolean>> checkEmailAvailability(
            @Parameter(description = "Email to check", required = true)
            @PathVariable String email) {
        logger.info("GET /api/v1/users/check/email/{} - Checking email availability", email);
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(Map.of("available", !exists));
    }

    @Operation(summary = "Get user statistics", description = "Get user statistics for admin dashboard")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    })
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        logger.info("GET /api/v1/users/stats - Fetching user statistics");

        Map<String, Object> stats = Map.of(
                "totalUsers", userService.getTotalUserCount(),
                "activeUsers", userService.getActiveUserCount(),
                "sellers", userService.getUserCountByRole(UserRole.SELLER),
                "shoppers", userService.getUserCountByRole(UserRole.SHOPPER),
                "admins", userService.getUserCountByRole(UserRole.ADMIN)
        );

        return ResponseEntity.ok(stats);
    }
}
