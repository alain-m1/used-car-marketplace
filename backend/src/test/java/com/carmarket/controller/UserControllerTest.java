// backend/src/test/java/com/carmarket/controller/UserControllerTest.java
package com.carmarket.controller;

import com.carmarket.dto.UserDTO;
import com.carmarket.model.UserRole;
import com.carmarket.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

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

    @Test
    @WithMockUser
    void getUserById_ShouldReturnUser_WhenUserExists() throws Exception {
        when(userService.getUserById(1L)).thenReturn(testUser);

        mockMvc.perform(get("/api/v1/users/1"))
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
    @WithMockUser
    void getUserByUsername_ShouldReturnUser_WhenUserExists() throws Exception {
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);

        mockMvc.perform(get("/api/v1/users/username/testuser"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username", is("testuser")))
                .andExpect(jsonPath("$.email", is("test@example.com")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_ShouldReturnPageOfUsers_WhenCalledByAdmin() throws Exception {
        List<UserDTO> users = Arrays.asList(testUser);
        Page<UserDTO> userPage = new PageImpl<>(users);

        when(userService.getAllUsers(any(Pageable.class))).thenReturn(userPage);

        mockMvc.perform(get("/api/v1/users")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].username", is("testuser")));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllUsers_ShouldReturnForbidden_WhenCalledByRegularUser() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());
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

        when(userService.createUser(any(UserDTO.class))).thenReturn(createdUser);

        mockMvc.perform(post("/api/v1/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(2)))
                .andExpect(jsonPath("$.username", is("newuser")))
                .andExpect(jsonPath("$.email", is("newuser@example.com")))
                .andExpect(jsonPath("$.isActive", is(true)));
    }

    @Test
    void createUser_ShouldReturnBadRequest_WhenInvalidInput() throws Exception {
        UserDTO invalidUser = new UserDTO();
        // Missing required fields

        mockMvc.perform(post("/api/v1/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidUser)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser", authorities = {"ROLE_USER"})
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
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email", is("updated@example.com")))
                .andExpect(jsonPath("$.firstName", is("Updated")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deactivateUser_ShouldReturnNoContent_WhenCalledByAdmin() throws Exception {
        mockMvc.perform(patch("/api/v1/users/1/deactivate")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void activateUser_ShouldReturnNoContent_WhenCalledByAdmin() throws Exception {
        mockMvc.perform(patch("/api/v1/users/1/activate")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void checkUsernameAvailability_ShouldReturnAvailabilityStatus() throws Exception {
        when(userService.existsByUsername("availableuser")).thenReturn(false);

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
    @WithMockUser(roles = "ADMIN")
    void getUserStats_ShouldReturnStatistics_WhenCalledByAdmin() throws Exception {
        when(userService.getTotalUserCount()).thenReturn(100L);
        when(userService.getActiveUserCount()).thenReturn(85L);
        when(userService.getUserCountByRole(UserRole.SELLER)).thenReturn(30L);
        when(userService.getUserCountByRole(UserRole.SHOPPER)).thenReturn(65L);
        when(userService.getUserCountByRole(UserRole.ADMIN)).thenReturn(5L);

        mockMvc.perform(get("/api/v1/users/stats"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalUsers", is(100)))
                .andExpect(jsonPath("$.activeUsers", is(85)))
                .andExpect(jsonPath("$.sellers", is(30)))
                .andExpect(jsonPath("$.shoppers", is(65)))
                .andExpect(jsonPath("$.admins", is(5)));
    }
}
