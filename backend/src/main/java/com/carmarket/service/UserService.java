// backend/src/main/java/com/carmarket/service/UserService.java
package com.carmarket.service;

import com.carmarket.dto.UserDTO;
import com.carmarket.exception.ResourceNotFoundException;
import com.carmarket.exception.UserAlreadyExistsException;
import com.carmarket.model.User;
import com.carmarket.model.UserRole;
import com.carmarket.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "#id")
    public UserDTO getUserById(Long id) {
        logger.debug("Fetching user by ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return convertToDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByUsername(String username) {
        logger.debug("Fetching user by username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return convertToDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByEmail(String email) {
        logger.debug("Fetching user by email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return convertToDTO(user);
    }

    @Transactional(readOnly = true)
    public Optional<UserDTO> getUserByCognitoUserId(String cognitoUserId) {
        logger.debug("Fetching user by Cognito User ID: {}", cognitoUserId);
        return userRepository.findByCognitoUserId(cognitoUserId)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        logger.debug("Fetching all users with pagination");
        return userRepository.findAll(pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getActiveUsers(Pageable pageable) {
        logger.debug("Fetching active users with pagination");
        return userRepository.findByIsActiveTrue(pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getUsersByRole(UserRole role, Pageable pageable) {
        logger.debug("Fetching users by role: {}", role);
        return userRepository.findByRole(role, pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> searchUsers(String searchTerm, Pageable pageable) {
        logger.debug("Searching users with term: {}", searchTerm);
        return userRepository.findBySearchTerm(searchTerm, pageable).map(this::convertToDTO);
    }

    @CacheEvict(value = "users", allEntries = true)
    public UserDTO createUser(UserDTO userDTO) {
        logger.info("Creating new user with username: {}", userDTO.getUsername());

        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + userDTO.getUsername());
        }

        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + userDTO.getEmail());
        }

        User user = convertToEntity(userDTO);
        User savedUser = userRepository.save(user);
        logger.info("Successfully created user with ID: {}", savedUser.getId());

        return convertToDTO(savedUser);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByCognitoId(String cognitoUserId) {
        return userRepository.findByCognitoUserId(cognitoUserId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("No user linked to this Cognito account"));
    }

    /**
     * Creates the profile row for an authenticated Cognito user and links it to the token's
     * {@code sub}. Idempotent per sub. Self-service sign-up can only pick SELLER or SHOPPER;
     * ADMIN is never granted here.
     */
    @CacheEvict(value = "users", allEntries = true)
    public UserDTO createUserForCognito(UserDTO userDTO, String cognitoUserId) {
        Optional<User> existing = userRepository.findByCognitoUserId(cognitoUserId);
        if (existing.isPresent()) {
            return convertToDTO(existing.get());
        }

        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + userDTO.getUsername());
        }
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + userDTO.getEmail());
        }

        User user = convertToEntity(userDTO);
        user.setRole(userDTO.getRole() == UserRole.SELLER ? UserRole.SELLER : UserRole.SHOPPER);
        user.setIsActive(true);
        if (user.getLocation() == null || user.getLocation().isBlank()) {
            user.setLocation("Not specified"); // users.location is NOT NULL
        }
        user.setCognitoUserId(cognitoUserId);
        return convertToDTO(userRepository.save(user));
    }

    @CacheEvict(value = "users", key = "#id")
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        logger.info("Updating user with ID: {}", id);

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Check if username is being changed and if it already exists
        if (!existingUser.getUsername().equals(userDTO.getUsername()) &&
                userRepository.existsByUsername(userDTO.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + userDTO.getUsername());
        }

        // Check if email is being changed and if it already exists
        if (!existingUser.getEmail().equals(userDTO.getEmail()) &&
                userRepository.existsByEmail(userDTO.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + userDTO.getEmail());
        }

        updateUserFields(existingUser, userDTO);
        User updatedUser = userRepository.save(existingUser);
        logger.info("Successfully updated user with ID: {}", updatedUser.getId());

        return convertToDTO(updatedUser);
    }

    @CacheEvict(value = "users", key = "#id")
    public void deactivateUser(Long id) {
        logger.info("Deactivating user with ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setIsActive(false);
        userRepository.save(user);
        logger.info("Successfully deactivated user with ID: {}", id);
    }

    @CacheEvict(value = "users", key = "#id")
    public void activateUser(Long id) {
        logger.info("Activating user with ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setIsActive(true);
        userRepository.save(user);
        logger.info("Successfully activated user with ID: {}", id);
    }

    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public long getTotalUserCount() {
        return userRepository.count();
    }

    @Transactional(readOnly = true)
    public long getActiveUserCount() {
        return userRepository.countByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public long getUserCountByRole(UserRole role) {
        return userRepository.countByRole(role);
    }

    private UserDTO convertToDTO(User user) {
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

    private User convertToEntity(UserDTO dto) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setLocation(dto.getLocation());
        user.setRole(dto.getRole() != null ? dto.getRole() : UserRole.SHOPPER);
        user.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        user.setProfilePictureUrl(dto.getProfilePictureUrl());
        return user;
    }

    private void updateUserFields(User user, UserDTO dto) {
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setLocation(dto.getLocation());
        if (dto.getRole() != null) {
            user.setRole(dto.getRole());
        }
        if (dto.getIsActive() != null) {
            user.setIsActive(dto.getIsActive());
        }
        if (dto.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(dto.getProfilePictureUrl());
        }
    }
}
