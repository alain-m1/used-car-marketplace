// backend/src/main/java/com/carmarket/controller/MessageController.java
package com.carmarket.controller;

import com.carmarket.dto.MessageDTO;
import com.carmarket.config.SecurityConfig.CognitoPrincipal;
import com.carmarket.service.MessageService;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/messages")
@Tag(name = "Messages", description = "APIs for managing messages between users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class MessageController {

    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);

    private final MessageService messageService;

    @Autowired
    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    /** Database id of the signed-in user, taken from the validated JWT (never from request parameters). */
    private Long currentUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof CognitoPrincipal principal
                && principal.getId() != null) {
            return principal.getId();
        }
        throw new AccessDeniedException("No user profile is linked to this account yet");
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    @Operation(summary = "Get message by ID", description = "Retrieve a message by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Message found successfully"),
            @ApiResponse(responseCode = "404", description = "Message not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<MessageDTO> getMessageById(
            @Parameter(description = "Message ID", required = true)
            @PathVariable Long id,
            Authentication authentication) {
        logger.info("GET /api/v1/messages/{} - Fetching message by ID", id);
        MessageDTO message = messageService.getMessageById(id);
        Long me = currentUserId(authentication);
        if (!isAdmin(authentication) && !me.equals(message.getSenderId()) && !me.equals(message.getRecipientId())) {
            throw new AccessDeniedException("Not a participant of this message");
        }
        return ResponseEntity.ok(message);
    }

    @Operation(summary = "Get user messages", description = "Get all messages for a user (sent and received)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Messages retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') and #userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Page<MessageDTO>> getUserMessages(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/messages/user/{} - Fetching messages for user", userId);
        Page<MessageDTO> messages = messageService.getUserMessages(userId, pageable);
        return ResponseEntity.ok(messages);
    }

    @Operation(summary = "Get received messages", description = "Get messages received by a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Received messages retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/user/{userId}/received")
    @PreAuthorize("hasRole('USER') and #userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Page<MessageDTO>> getReceivedMessages(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/messages/user/{}/received - Fetching received messages", userId);
        Page<MessageDTO> messages = messageService.getReceivedMessages(userId, pageable);
        return ResponseEntity.ok(messages);
    }

    @Operation(summary = "Get sent messages", description = "Get messages sent by a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sent messages retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/user/{userId}/sent")
    @PreAuthorize("hasRole('USER') and #userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Page<MessageDTO>> getSentMessages(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/messages/user/{}/sent - Fetching sent messages", userId);
        Page<MessageDTO> messages = messageService.getSentMessages(userId, pageable);
        return ResponseEntity.ok(messages);
    }

    @Operation(summary = "Get unread messages", description = "Get unread messages for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unread messages retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/user/{userId}/unread")
    @PreAuthorize("hasRole('USER') and #userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Page<MessageDTO>> getUnreadMessages(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/messages/user/{}/unread - Fetching unread messages", userId);
        Page<MessageDTO> messages = messageService.getUnreadMessages(userId, pageable);
        return ResponseEntity.ok(messages);
    }

    @Operation(summary = "Get conversation for listing", description = "Get conversation between user and others for a specific listing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conversation retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User or listing not found")
    })
    @GetMapping("/listing/{listingId}/user/{userId}")
    @PreAuthorize("hasRole('USER') and #userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<List<MessageDTO>> getConversationForListing(
            @Parameter(description = "Car listing ID", required = true)
            @PathVariable Long listingId,
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId) {
        logger.info("GET /api/v1/messages/listing/{}/user/{} - Fetching conversation", listingId, userId);
        List<MessageDTO> messages = messageService.getConversationForListing(listingId, userId);
        return ResponseEntity.ok(messages);
    }

    @Operation(summary = "Get conversation between users", description = "Get conversation between two users for a specific listing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conversation retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User or listing not found")
    })
    @GetMapping("/conversation")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<MessageDTO>> getConversationBetweenUsers(
            @Parameter(description = "First user ID", required = true)
            @RequestParam Long user1Id,
            @Parameter(description = "Second user ID", required = true)
            @RequestParam Long user2Id,
            @Parameter(description = "Car listing ID", required = true)
            @RequestParam Long listingId,
            Authentication authentication) {
        Long me = currentUserId(authentication);
        if (!isAdmin(authentication) && !me.equals(user1Id) && !me.equals(user2Id)) {
            throw new AccessDeniedException("Not a participant of this conversation");
        }
        logger.info("GET /api/v1/messages/conversation - Fetching conversation between users {} and {} for listing {}",
                user1Id, user2Id, listingId);
        List<MessageDTO> messages = messageService.getConversationBetweenUsers(user1Id, user2Id, listingId);
        return ResponseEntity.ok(messages);
    }

    @Operation(summary = "Send a message", description = "Send a new message to another user about a listing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Message sent successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Recipient or listing not found")
    })
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<MessageDTO> sendMessage(
            @Parameter(description = "Message data", required = true)
            @Valid @RequestBody MessageDTO messageDTO,
            Authentication authentication) {
        Long senderId = currentUserId(authentication);
        logger.info("POST /api/v1/messages - Sending message from user {} to user {} for listing {}",
                senderId, messageDTO.getRecipientId(), messageDTO.getCarListingId());
        MessageDTO sentMessage = messageService.sendMessage(messageDTO, senderId);
        return ResponseEntity.status(HttpStatus.CREATED).body(sentMessage);
    }

    @Operation(summary = "Mark message as read", description = "Mark a message as read")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Message marked as read successfully"),
            @ApiResponse(responseCode = "401", description = "User not authorized"),
            @ApiResponse(responseCode = "404", description = "Message not found")
    })
    @PatchMapping("/{messageId}/read")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> markAsRead(
            @Parameter(description = "Message ID", required = true)
            @PathVariable Long messageId,
            Authentication authentication) {
        Long userId = currentUserId(authentication);
        logger.info("PATCH /api/v1/messages/{}/read - Marking message as read by user {}", messageId, userId);
        messageService.markAsRead(messageId, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Mark all messages as read", description = "Mark all messages as read for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "All messages marked as read successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PatchMapping("/user/{userId}/read-all")
    @PreAuthorize("hasRole('USER') and #userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Void> markAllAsRead(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId) {
        logger.info("PATCH /api/v1/messages/user/{}/read-all - Marking all messages as read", userId);
        messageService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get unread message count", description = "Get count of unread messages for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unread count retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/user/{userId}/unread-count")
    @PreAuthorize("hasRole('USER') and #userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getUnreadMessageCount(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId) {
        logger.info("GET /api/v1/messages/user/{}/unread-count - Getting unread message count", userId);
        long count = messageService.getUnreadMessageCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @Operation(summary = "Get message count for listing", description = "Get total message count for a specific listing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Message count retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
    })
    @GetMapping("/listing/{listingId}/count")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Long>> getMessageCountForListing(
            @Parameter(description = "Car listing ID", required = true)
            @PathVariable Long listingId) {
        logger.info("GET /api/v1/messages/listing/{}/count - Getting message count for listing", listingId);
        long count = messageService.getMessageCountForListing(listingId);
        return ResponseEntity.ok(Map.of("messageCount", count));
    }
}
