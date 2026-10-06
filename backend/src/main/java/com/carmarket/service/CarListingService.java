// backend/src/main/java/com/carmarket/service/CarListingService.java
package com.carmarket.service;

import com.carmarket.dto.CarListingDTO;
import com.carmarket.exception.ResourceNotFoundException;
import com.carmarket.model.CarListing;
import com.carmarket.model.ListingStatus;
import com.carmarket.model.User;
import com.carmarket.repository.CarListingRepository;
import com.carmarket.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class CarListingService {

    private static final Logger logger = LoggerFactory.getLogger(CarListingService.class);

    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;

    @Autowired
    public CarListingService(CarListingRepository carListingRepository, UserRepository userRepository) {
        this.carListingRepository = carListingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "carListings", key = "#id")
    public CarListingDTO getCarListingById(Long id) {
        logger.debug("Fetching car listing by ID: {}", id);
        CarListing carListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + id));
        return convertToDTO(carListing);
    }

    @Transactional
    public CarListingDTO getCarListingByIdAndIncrementView(Long id) {
        logger.debug("Fetching car listing by ID and incrementing view count: {}", id);
        CarListing carListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + id));

        carListing.incrementViewCount();
        carListingRepository.save(carListing);

        return convertToDTO(carListing);
    }

    @Transactional(readOnly = true)
    public Page<CarListingDTO> getAllActiveListings(Pageable pageable) {
        logger.debug("Fetching all active car listings with pagination");
        return carListingRepository.findByStatus(ListingStatus.ACTIVE, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<CarListingDTO> getListingsBySeller(Long sellerId, Pageable pageable) {
        logger.debug("Fetching listings by seller ID: {}", sellerId);
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + sellerId));

        return carListingRepository.findBySeller(seller, pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<CarListingDTO> searchListings(String searchTerm, Pageable pageable) {
        logger.debug("Searching listings with term: {}", searchTerm);
        return carListingRepository.findBySearchTerm(searchTerm, pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<CarListingDTO> getListingsByFilters(BigDecimal minPrice, BigDecimal maxPrice,
                                                    Integer minYear, Integer maxYear,
                                                    Integer minMileage, Integer maxMileage,
                                                    String make, String model,
                                                    Pageable pageable) {
        logger.debug("Filtering listings with criteria - Price: {}-{}, Year: {}-{}, Mileage: {}-{}, Make: {}, Model: {}",
                minPrice, maxPrice, minYear, maxYear, minMileage, maxMileage, make, model);

        // Only add predicates for filters that were supplied. Passing null parameters through a
        // JPQL "(:x IS NULL OR ...)" query fails on PostgreSQL (untyped null / lower(bytea)).
        Specification<CarListing> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), ListingStatus.ACTIVE));
            if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            if (minYear != null) predicates.add(cb.greaterThanOrEqualTo(root.get("year"), minYear));
            if (maxYear != null) predicates.add(cb.lessThanOrEqualTo(root.get("year"), maxYear));
            if (minMileage != null) predicates.add(cb.greaterThanOrEqualTo(root.get("mileage"), minMileage));
            if (maxMileage != null) predicates.add(cb.lessThanOrEqualTo(root.get("mileage"), maxMileage));
            if (make != null && !make.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("make")), "%" + make.trim().toLowerCase() + "%"));
            }
            if (model != null && !model.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("model")), "%" + model.trim().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return carListingRepository.findAll(spec, pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<CarListingDTO> getLatestListings(Pageable pageable) {
        logger.debug("Fetching latest active listings");
        return carListingRepository.findLatestActiveListings(pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<CarListingDTO> getMostViewedListings(Pageable pageable) {
        logger.debug("Fetching most viewed listings");
        return carListingRepository.findMostViewedListings(pageable).map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<String> getAvailableMakes() {
        logger.debug("Fetching available makes");
        return carListingRepository.findDistinctMakes();
    }

    @Transactional(readOnly = true)
    public List<String> getAvailableModelsByMake(String make) {
        logger.debug("Fetching available models for make: {}", make);
        return carListingRepository.findDistinctModelsByMake(make);
    }

    @CacheEvict(value = "carListings", allEntries = true)
    public CarListingDTO createListing(CarListingDTO listingDTO, Long sellerId) {
        logger.info("Creating new car listing for seller ID: {}", sellerId);

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + sellerId));

        CarListing carListing = convertToEntity(listingDTO);
        carListing.setSeller(seller);
        carListing.setStatus(ListingStatus.ACTIVE);

        CarListing savedListing = carListingRepository.save(carListing);
        logger.info("Successfully created car listing with ID: {}", savedListing.getId());

        return convertToDTO(savedListing);
    }

    @CacheEvict(value = "carListings", key = "#id")
    public CarListingDTO updateListing(Long id, CarListingDTO listingDTO, Long userId, boolean isAdmin) {
        logger.info("Updating car listing with ID: {} by user: {}", id, userId);

        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + id));

        requireOwnerOrAdmin(existingListing, userId, isAdmin);

        updateListingFields(existingListing, listingDTO);
        CarListing updatedListing = carListingRepository.save(existingListing);
        logger.info("Successfully updated car listing with ID: {}", updatedListing.getId());

        return convertToDTO(updatedListing);
    }

    @CacheEvict(value = "carListings", key = "#id")
    public void updateListingStatus(Long id, ListingStatus status, Long userId, boolean isAdmin) {
        logger.info("Updating listing status for ID: {} to {} by user: {}", id, status, userId);

        CarListing listing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + id));

        requireOwnerOrAdmin(listing, userId, isAdmin);

        listing.setStatus(status);
        carListingRepository.save(listing);
        logger.info("Successfully updated listing status for ID: {}", id);
    }

    @CacheEvict(value = "carListings", key = "#id")
    public void deleteListing(Long id, Long userId, boolean isAdmin) {
        logger.info("Deleting car listing with ID: {} by user: {}", id, userId);

        CarListing listing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Car listing not found with id: " + id));

        requireOwnerOrAdmin(listing, userId, isAdmin);

        carListingRepository.delete(listing);
        logger.info("Successfully deleted car listing with ID: {}", id);
    }

    /** Only the listing's seller (or an admin) may change it. userId comes from the validated token. */
    private void requireOwnerOrAdmin(CarListing listing, Long userId, boolean isAdmin) {
        if (!isAdmin && !listing.getSeller().getId().equals(userId)) {
            throw new AccessDeniedException("You can only change your own listings");
        }
    }

    @Transactional(readOnly = true)
    public long getTotalListingCount() {
        return carListingRepository.count();
    }

    @Transactional(readOnly = true)
    public long getActiveListingCount() {
        return carListingRepository.countByStatus(ListingStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public long getListingCountBySeller(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + sellerId));
        return carListingRepository.countBySeller(seller);
    }

    @Transactional(readOnly = true)
    public BigDecimal getAveragePrice() {
        BigDecimal avgPrice = carListingRepository.findAveragePrice();
        return avgPrice != null ? avgPrice : BigDecimal.ZERO;
    }

    private CarListingDTO convertToDTO(CarListing carListing) {
        CarListingDTO dto = new CarListingDTO();
        dto.setId(carListing.getId());
        dto.setTitle(carListing.getTitle());
        dto.setDescription(carListing.getDescription());
        dto.setPrice(carListing.getPrice());
        dto.setMileage(carListing.getMileage());
        dto.setYear(carListing.getYear());
        dto.setMake(carListing.getMake());
        dto.setModel(carListing.getModel());
        dto.setSellerId(carListing.getSeller().getId());
        dto.setSellerName(carListing.getSeller().getFullName());
        dto.setSellerLocation(carListing.getSeller().getLocation());
        dto.setSellerPhone(carListing.getSeller().getPhoneNumber());
        dto.setStatus(carListing.getStatus());
        // Copy while the session is open: open-in-view is off, so the lazy collection can't be read during JSON serialization
        dto.setImageUrls(carListing.getImageUrls() == null ? new java.util.ArrayList<>() : new java.util.ArrayList<>(carListing.getImageUrls()));
        dto.setViewCount(carListing.getViewCount());
        dto.setCreatedAt(carListing.getCreatedAt());
        dto.setUpdatedAt(carListing.getUpdatedAt());
        return dto;
    }

    private CarListing convertToEntity(CarListingDTO dto) {
        CarListing carListing = new CarListing();
        carListing.setTitle(dto.getTitle());
        carListing.setDescription(dto.getDescription());
        carListing.setPrice(dto.getPrice());
        carListing.setMileage(dto.getMileage());
        carListing.setYear(dto.getYear());
        carListing.setMake(dto.getMake());
        carListing.setModel(dto.getModel());
        if (dto.getImageUrls() != null) {
            carListing.setImageUrls(dto.getImageUrls());
        }
        return carListing;
    }

    private void updateListingFields(CarListing carListing, CarListingDTO dto) {
        carListing.setTitle(dto.getTitle());
        carListing.setDescription(dto.getDescription());
        carListing.setPrice(dto.getPrice());
        carListing.setMileage(dto.getMileage());
        carListing.setYear(dto.getYear());
        carListing.setMake(dto.getMake());
        carListing.setModel(dto.getModel());
        if (dto.getImageUrls() != null) {
            carListing.setImageUrls(dto.getImageUrls());
        }
    }
}
