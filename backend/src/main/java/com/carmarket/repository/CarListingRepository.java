// backend/src/main/java/com/carmarket/repository/CarListingRepository.java
package com.carmarket.repository;

import com.carmarket.model.CarListing;
import com.carmarket.model.ListingStatus;
import com.carmarket.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarListingRepository extends JpaRepository<CarListing, Long> {

    Page<CarListing> findByStatus(ListingStatus status, Pageable pageable);

    Page<CarListing> findBySeller(User seller, Pageable pageable);

    Page<CarListing> findBySellerAndStatus(User seller, ListingStatus status, Pageable pageable);

    @Query("SELECT cl FROM CarListing cl WHERE cl.status = 'ACTIVE' AND " +
            "(:minPrice IS NULL OR cl.price >= :minPrice) AND " +
            "(:maxPrice IS NULL OR cl.price <= :maxPrice) AND " +
            "(:minYear IS NULL OR cl.year >= :minYear) AND " +
            "(:maxYear IS NULL OR cl.year <= :maxYear) AND " +
            "(:minMileage IS NULL OR cl.mileage >= :minMileage) AND " +
            "(:maxMileage IS NULL OR cl.mileage <= :maxMileage) AND " +
            "(:make IS NULL OR LOWER(cl.make) LIKE LOWER(CONCAT('%', :make, '%'))) AND " +
            "(:model IS NULL OR LOWER(cl.model) LIKE LOWER(CONCAT('%', :model, '%')))")
    Page<CarListing> findByFilters(@Param("minPrice") BigDecimal minPrice,
                                   @Param("maxPrice") BigDecimal maxPrice,
                                   @Param("minYear") Integer minYear,
                                   @Param("maxYear") Integer maxYear,
                                   @Param("minMileage") Integer minMileage,
                                   @Param("maxMileage") Integer maxMileage,
                                   @Param("make") String make,
                                   @Param("model") String model,
                                   Pageable pageable);

    @Query("SELECT cl FROM CarListing cl WHERE cl.status = 'ACTIVE' AND " +
            "(LOWER(cl.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(cl.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(cl.make) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(cl.model) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<CarListing> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT DISTINCT cl.make FROM CarListing cl WHERE cl.status = 'ACTIVE' ORDER BY cl.make")
    List<String> findDistinctMakes();

    @Query("SELECT DISTINCT cl.model FROM CarListing cl WHERE cl.status = 'ACTIVE' AND " +
            "LOWER(cl.make) = LOWER(:make) ORDER BY cl.model")
    List<String> findDistinctModelsByMake(@Param("make") String make);

    @Query("SELECT cl FROM CarListing cl WHERE cl.status = 'ACTIVE' ORDER BY cl.createdAt DESC")
    Page<CarListing> findLatestActiveListings(Pageable pageable);

    @Query("SELECT cl FROM CarListing cl WHERE cl.status = 'ACTIVE' ORDER BY cl.viewCount DESC")
    Page<CarListing> findMostViewedListings(Pageable pageable);

    @Query("SELECT cl FROM CarListing cl WHERE cl.status = 'ACTIVE' ORDER BY cl.price ASC")
    Page<CarListing> findByPriceLowToHigh(Pageable pageable);

    @Query("SELECT cl FROM CarListing cl WHERE cl.status = 'ACTIVE' ORDER BY cl.price DESC")
    Page<CarListing> findByPriceHighToLow(Pageable pageable);

    long countByStatus(ListingStatus status);

    long countBySeller(User seller);

    long countBySellerAndStatus(User seller, ListingStatus status);

    @Query("SELECT AVG(cl.price) FROM CarListing cl WHERE cl.status = 'ACTIVE'")
    BigDecimal findAveragePrice();

    @Query("SELECT MIN(cl.price) FROM CarListing cl WHERE cl.status = 'ACTIVE'")
    BigDecimal findMinPrice();

    @Query("SELECT MAX(cl.price) FROM CarListing cl WHERE cl.status = 'ACTIVE'")
    BigDecimal findMaxPrice();
}
