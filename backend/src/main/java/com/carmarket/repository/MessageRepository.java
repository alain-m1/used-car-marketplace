// backend/src/main/java/com/carmarket/repository/MessageRepository.java
package com.carmarket.repository;

import com.carmarket.model.CarListing;
import com.carmarket.model.Message;
import com.carmarket.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findBySender(User sender, Pageable pageable);

    Page<Message> findByRecipient(User recipient, Pageable pageable);

    Page<Message> findByCarListing(CarListing carListing, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender = :user OR m.recipient = :user) " +
            "ORDER BY m.sentAt DESC")
    Page<Message> findByUserInvolved(@Param("user") User user, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE " +
            "m.carListing = :carListing AND " +
            "(m.sender = :user OR m.recipient = :user) " +
            "ORDER BY m.sentAt ASC")
    List<Message> findConversationForListing(@Param("carListing") CarListing carListing,
                                             @Param("user") User user);

    @Query("SELECT m FROM Message m WHERE " +
            "((m.sender = :user1 AND m.recipient = :user2) OR " +
            "(m.sender = :user2 AND m.recipient = :user1)) AND " +
            "m.carListing = :carListing " +
            "ORDER BY m.sentAt ASC")
    List<Message> findConversationBetweenUsers(@Param("user1") User user1,
                                               @Param("user2") User user2,
                                               @Param("carListing") CarListing carListing);

    Page<Message> findByRecipientAndIsReadFalse(User recipient, Pageable pageable);

    long countByRecipientAndIsReadFalse(User recipient);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.carListing = :carListing")
    long countByCarListing(@Param("carListing") CarListing carListing);

    @Query("SELECT DISTINCT m.carListing FROM Message m WHERE " +
            "(m.sender = :user OR m.recipient = :user) " +
            "ORDER BY MAX(m.sentAt) DESC")
    List<CarListing> findDistinctCarListingsByUserInvolved(@Param("user") User user);
}
