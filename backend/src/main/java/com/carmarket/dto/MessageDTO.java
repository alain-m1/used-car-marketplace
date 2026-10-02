// backend/src/main/java/com/carmarket/dto/MessageDTO.java
package com.carmarket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class MessageDTO {

    private Long id;

    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    @NotNull(message = "Car listing ID is required")
    private Long carListingId;

    @NotBlank(message = "Message content is required")
    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String content;

    private Long senderId;
    private String senderName;
    private String recipientName;
    private String carListingTitle;
    private Boolean isRead;
    private LocalDateTime sentAt;

    // Constructors
    public MessageDTO() {}

    public MessageDTO(Long recipientId, Long carListingId, String content) {
        this.recipientId = recipientId;
        this.carListingId = carListingId;
        this.content = content;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public Long getCarListingId() {
        return carListingId;
    }

    public void setCarListingId(Long carListingId) {
        this.carListingId = carListingId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getCarListingTitle() {
        return carListingTitle;
    }

    public void setCarListingTitle(String carListingTitle) {
        this.carListingTitle = carListingTitle;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
}
