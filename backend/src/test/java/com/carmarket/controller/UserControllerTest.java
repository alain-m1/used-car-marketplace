// backend/src/test/java/com/carmarket/controller/UserControllerTest.java
package com.carmarket.controller;

import com.carmarket.config.SecurityConfig;
import com.carmarket.config.SecurityConfig.CognitoAuthenticationToken;
import com.carmarket.config.SecurityConfig.CognitoPrincipal;
import com.carmarket.dto.UserDTO;
import com.carmarket.model.UserRole;
import com.carmarket.repository.UserRepository;
import com.carmarket.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller tests run against the real {@link SecurityConfig}: public GET endpoints, bearer-token
 * resource server and method security. Requests are authenticated with the same
 * {@link CognitoAuthenticationToken} the JWT converter produces, so {@code @PreAuthorize}
 * expressions such as {@code #id == authentication.principal.id} are evaluated for real.
 */
@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "aws.region=us-east-2",
        "aws.cognito.user-pool-id=us-east-2_TestPool",
        "app.cors.allowed-origins=http://localhost:3000"
})
class UserControllerTest {

    private static final String SUB = "11111111-2222-3333-4444-555555555555";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    // Required by SecurityConfig's JWT-to-authentication converter
    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UserDTO testUser;

    @BeforeEach
    void setUp() {
        testUser = new UserDTO();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setLocation("Test City");
        testUser.setRole(UserRole.SHOPPER);
        testUser.setIsActive(true);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
    }

    /** A signed-in request: Cognito principal linked to database user {@code userId}, plus the given roles. */
    private static RequestPostProcessor signedInAs(Long userId, String... roles) {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .subject(SUB)
                .claim("token_use", "access")
                .build();
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        for (String role : roles) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        return authentication(new CognitoAuthenticationToken(
                jwt, new CognitoPrincipal(userId, SUB, "testuser"), authorities));
    }

    @Test
    void getUserById_ShouldReturnUser_WhenUserExists() throws Exception {
        when(userService.getUserById(1L)).thenReturn(testUser);

        mockMvc.perform(get("/api/v1/users/1").with(signedInAs(1L, "SHOPPER")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.username", is("testuser")))
                .andExpect(jsonPath("$.email", is("test@example.com")))
                .andExpect(jsonPath("$.firstName", is("Test")))
                .andExpect(jsonPath("$.lastName", is("User")))
                .andExpect(jsonPath("$.role", is("SHOPPER")))
                .andExpect(jsonPath("$.isActive", is(true)));
    }

    @Test
    void getUserById_ShouldReturnUnauthorized_WhenNoToken() throws Exception {
        mockMvc.perform(get("/api/v1/users/1"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(userService);
    }

    @Test
    void getUserByUsername_ShouldReturnUser_WhenUserExists() throws Exception {
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);

        mockMvc.perform(get("/api/v1/users/username/testuser").with(signedInAs(1L, "SHOPPER")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username", is("testuser")))
                .andExpect(jsonPath("$.email", is("test@example.com")));
    }

    @Test
    void getCurrentUser_ShouldReturnProfileLinkedToTokenSub() throws Exception {
        when(userService.getUserByCognitoId(SUB)).thenReturn(testUser);

        mockMvc.perform(get("/api/v1/users/me").with(signedInAs(1L, "SHOPPER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.username", is("testuser")));
    }

    @Test
    void getAllUsers_ShouldReturnPageOfUsers_WhenCalledByAdmin() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserDTO> userPage = new PageImpl<>(Arrays.asList(testUser), pageable, 1);

        when(userService.getAllUsers(any(Pageable.class))).thenReturn(userPage);

        mockMvc.perform(get("/api/v1/users")
                        .with(signedInAs(9L, "ADMIN"))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].username", is("testuser")));
    }

    @Test
    void getAllUsers_ShouldReturnForbidden_WhenCalledByRegularUser() throws Exception {
        mockMvc.perform(get("/api/v1/users").with(signedInAs(1L, "SHOPPER")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Test
    void createUser_ShouldReturnCreatedUser_WhenValidInput() throws Exception {
        UserDTO newUser = new UserDTO();
        newUser.setUsername("newuser");
        newUser.setEmail("newuser@example.com");
        newUser.setFirstName("New");
        newUser.setLastName("User");
        newUser.setLocation("New City");
        newUser.setRole(UserRole.SHOPPER);

        UserDTO createdUser = new UserDTO();
        createdUser.setId(2L);
        createdUser.setUsername("newuser");
        createdUser.setEmail("newuser@example.com");
        createdUser.setFirstName("New");
        createdUser.setLastName("User");
        createdUser.setLocation("New City");
        createdUser.setRole(UserRole.SHOPPER);
        createdUser.setIsActive(true);
        createdUser.setCreatedAt(LocalDateTime.now());

        // The profile is linked to the Cognito sub of the access token
        when(userService.createUserForCognito(any(UserDTO.class), eq(SUB))).thenReturn(createdUser);

        // A brand-new Cognito user has no database row yet, so the principal id is null
        mockMvc.perform(post("/api/v1/users")
                        .with(signedInAs(null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(2)))
                .andExpect(jsonPath("$.username", is("newuser")))
                .andExpect(jsonPath("$.email", is("newuser@example.com")))
                .andExpect(jsonPath("$.isActive", is(true)));

        verify(userService).createUserForCognito(any(UserDTO.class), eq(SUB));
    }

    @Test
    void createUser_ShouldReturnBadRequest_WhenInvalidInput() throws Exception {
        UserDTO invalidUser = new UserDTO();
        // Missing required fields

        mockMvc.perform(post("/api/v1/users")
                        .with(signedInAs(null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidUser)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(userService);
    }

    @Test
    void createUser_ShouldReturnUnauthorized_WhenNoToken() throws Exception {
        UserDTO newUser = new UserDTO();
        newUser.setUsername("newuser");
        newUser.setEmail("newuser@example.com");

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(userService);
    }

    @Test
    void updateUser_ShouldReturnUpdatedUser_WhenUserUpdatesOwnProfile() throws Exception {
        UserDTO updatedUser = new UserDTO();
        updatedUser.setId(1L);
        updatedUser.setUsername("testuser");
        updatedUser.setEmail("updated@example.com");
        updatedUser.setFirstName("Updated");
        updatedUser.setLastName("User");
        updatedUser.setLocation("Updated City");
        updatedUser.setRole(UserRole.SHOPPER);
        updatedUser.setIsActive(true);

        when(userService.updateUser(eq(1L), any(UserDTO.class))).thenReturn(updatedUser);

        mockMvc.perform(put("/api/v1/users/1")
                        .with(signedInAs(1L, "SHOPPER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email", is("updated@example.com")))
                .andExpect(jsonPath("$.firstName", is("Updated")));
    }

    @Test
    void deactivateUser_ShouldReturnNoContent_WhenCalledByAdmin() throws Exception {
        mockMvc.perform(patch("/api/v1/users/1/deactivate").with(signedInAs(9L, "ADMIN")))
                .andExpect(status().isNoContent());

        verify(userService).deactivateUser(1L);
    }

    @Test
    void activateUser_ShouldReturnNoContent_WhenCalledByAdmin() throws Exception {
        mockMvc.perform(patch("/api/v1/users/1/activate").with(signedInAs(9L, "ADMIN")))
                .andExpect(status().isNoContent());

        verify(userService).activateUser(1L);
    }

    @Test
    void checkUsernameAvailability_ShouldReturnAvailabilityStatus() throws Exception {
        when(userService.existsByUsername("availableuser")).thenReturn(false);

        // Public: the registration form calls this before the user has a token
        mockMvc.perform(get("/api/v1/users/check/username/availableuser"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.available", is(true)));
    }

    @Test
    void checkEmailAvailability_ShouldReturnAvailabilityStatus() throws Exception {
        when(userService.existsByEmail("available@example.com")).thenReturn(false);

        mockMvc.perform(get("/api/v1/users/check/email/available@example.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.available", is(true)));
    }

    @Test
    void getUserStats_ShouldReturnStatistics_WhenCalledByAdmin() throws Exception {
        when(userService.getTotalUserCount()).thenReturn(100L);
        when(userService.getActiveUserCount()).thenReturn(85L);
        when(userService.getUserCountByRole(UserRole.SELLER)).thenReturn(30L);
        when(userService.getUserCountByRole(UserRole.SHOPPER)).thenReturn(65L);
        when(userService.getUserCountByRole(UserRole.ADMIN)).thenReturn(5L);

        mockMvc.perform(get("/api/v1/users/stats").with(signedInAs(9L, "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalUsers", is(100)))
                .andExpect(jsonPath("$.activeUsers", is(85)))
                .andExpect(jsonPath("$.sellers", is(30)))
                .andExpect(jsonPath("$.shoppers", is(65)))
                .andExpect(jsonPath("$.admins", is(5)));
    }
}
