// backend/src/main/java/com/carmarket/service/MessageService.java
package com.carmarket.service;

import com.carmarket.dto.MessageDTO;
import com.carmarket.exception.ResourceNotFoundException;
import com.carmarket.model.CarListing;
import com.carmarket.model.Message;
import com.carmarket.model.User;
import com.carmarket.repository.CarListingRepository;
import com.carmarket.repository.MessageRepository;
import com.carmarket.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessageService {

    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final CarListingRepository carListingRepository;

    @Autowired
    public MessageService(MessageRepository messageRepository, UserRepository userRepository,
                          CarListingRepository carListingRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.carListingRepository = carListingRepository;
    }

    @Transactional(readOnly = true)
    public MessageDTO getMessageById(Long id) {
        logger.debug("Fetching message by ID: {}", id);
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
        return convertToDTO(message);
    }

    @Transactional(readOnly = true)
    public Page<MessageDTO> getUserMessages(Long userId, Pageable pageable) {
        logger.debug("Fetching messages for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return messageRepository.findByUserInvolved(user, pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<MessageDTO> getReceivedMessages(Long userId, Pageable pageable) {
        logger.debug("Fetching received messages for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return messageRepository.findByRecipient(user, pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<MessageDTO> getSentMessages(Long userId, Pageable pageable) {
        logger.debug("Fetching sent messages for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return messageRepository.findBySender(user, pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<MessageDTO> getUnreadMessages(Long userId, Pageable pageable) {
        logger.debug("Fetching unread messages for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return messageRepository.findByRecipientAndIsReadFalse(user, pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<MessageDTO> getConversationForListing(Long carListingId, Long userId) {
        logger.debug("Fetching conversation for listing ID: {} and user ID: {}", carListingId, userId);

        CarListing carListing = carListingRepository.findById(carListingId)
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + carListingId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Message> messages = messageRepository.findConversationForListing(carListing, user);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MessageDTO> getConversationBetweenUsers(Long user1Id, Long user2Id, Long carListingId) {
        logger.debug("Fetching conversation between users {} and {} for listing {}", user1Id, user2Id, carListingId);

        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + user1Id));

        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + user2Id));

        CarListing carListing = carListingRepository.findById(carListingId)
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + carListingId));

        List<Message> messages = messageRepository.findConversationBetweenUsers(user1, user2, carListing);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public MessageDTO sendMessage(MessageDTO messageDTO, Long senderId) {
        logger.info("Sending message from user ID: {} to user ID: {} for listing ID: {}",
                senderId, messageDTO.getRecipientId(), messageDTO.getCarListingId());

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found with id: " + senderId));

        User recipient = userRepository.findById(messageDTO.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found with id: " + messageDTO.getRecipientId()));

        CarListing carListing = carListingRepository.findById(messageDTO.getCarListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + messageDTO.getCarListingId()));

        Message message = new Message(sender, recipient, carListing, messageDTO.getContent());
        Message savedMessage = messageRepository.save(message);

        logger.info("Successfully sent message with ID: {}", savedMessage.getId());
        return convertToDTO(savedMessage);
    }

    public void markAsRead(Long messageId, Long userId) {
        logger.info("Marking message ID: {} as read by user ID: {}", messageId, userId);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));

        // Only the recipient can mark a message as read
        if (!message.getRecipient().getId().equals(userId)) {
            throw new IllegalArgumentException("User is not authorized to mark this message as read");
        }

        message.setIsRead(true);
        messageRepository.save(message);
        logger.info("Successfully marked message ID: {} as read", messageId);
    }

    public void markAllAsRead(Long userId) {
        logger.info("Marking all messages as read for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Message> unreadMessages = messageRepository.findByRecipientAndIsReadFalse(user, Pageable.unpaged()).getContent();
        unreadMessages.forEach(message -> message.setIsRead(true));
        messageRepository.saveAll(unreadMessages);

        logger.info("Successfully marked {} messages as read for user ID: {}", unreadMessages.size(), userId);
    }

    @Transactional(readOnly = true)
    public long getUnreadMessageCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return messageRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional(readOnly = true)
    public long getMessageCountForListing(Long carListingId) {
        CarListing carListing = carListingRepository.findById(carListingId)
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + carListingId));

        return messageRepository.countByCarListing(carListing);
    }

    private MessageDTO convertToDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getFullName());
        dto.setRecipientId(message.getRecipient().getId());
        dto.setRecipientName(message.getRecipient().getFullName());
        dto.setCarListingId(message.getCarListing().getId());
        dto.setCarListingTitle(message.getCarListing().getTitle());
        dto.setContent(message.getContent());
        dto.setIsRead(message.getIsRead());
        dto.setSentAt(message.getSentAt());
        return dto;
    }
}
