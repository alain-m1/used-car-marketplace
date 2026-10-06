// backend/src/main/java/com/carmarket/controller/CarListingController.java
package com.carmarket.controller;

import com.carmarket.config.SecurityConfig;
import com.carmarket.dto.CarListingDTO;
import com.carmarket.model.ListingStatus;
import com.carmarket.service.CarListingService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/listings")
@Tag(name = "Car Listings", description = "APIs for managing car listings")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class CarListingController {

    private static final Logger logger = LoggerFactory.getLogger(CarListingController.class);

    private final CarListingService carListingService;

    @Autowired
    public CarListingController(CarListingService carListingService) {
        this.carListingService = carListingService;
    }

    /** Database id of the signed-in user, taken from the validated JWT (never from request parameters). */
    private Long currentUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof SecurityConfig.CognitoPrincipal principal
                && principal.getId() != null) {
            return principal.getId();
        }
        throw new AccessDeniedException("No user profile is linked to this account yet");
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    @Operation(summary = "Get car listing by ID", description = "Retrieve a car listing by its ID and increment view count")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Car listing found successfully"),
            @ApiResponse(responseCode = "404", description = "Car listing not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<CarListingDTO> getCarListingById(
            @Parameter(description = "Car listing ID", required = true)
            @PathVariable Long id) {
        logger.info("GET /api/v1/listings/{} - Fetching car listing by ID", id);
        CarListingDTO listing = carListingService.getCarListingByIdAndIncrementView(id);
        return ResponseEntity.ok(listing);
    }

    @Operation(summary = "Get all active listings", description = "Retrieve all active car listings with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Active listings retrieved successfully")
    })
    @GetMapping
    public ResponseEntity<Page<CarListingDTO>> getAllActiveListings(
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/listings - Fetching all active listings with pagination");
        Page<CarListingDTO> listings = carListingService.getAllActiveListings(pageable);
        return ResponseEntity.ok(listings);
    }

    @Operation(summary = "Get listings by seller", description = "Retrieve car listings by seller ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Seller listings retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Seller not found")
    })
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Page<CarListingDTO>> getListingsBySeller(
            @Parameter(description = "Seller ID", required = true)
            @PathVariable Long sellerId,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/listings/seller/{} - Fetching listings by seller", sellerId);
        Page<CarListingDTO> listings = carListingService.getListingsBySeller(sellerId, pageable);
        return ResponseEntity.ok(listings);
    }

    @Operation(summary = "Search listings", description = "Search car listings by keyword")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
    })
    @GetMapping("/search")
    public ResponseEntity<Page<CarListingDTO>> searchListings(
            @Parameter(description = "Search term", required = true)
            @RequestParam String q,
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/listings/search?q={} - Searching listings", q);
        Page<CarListingDTO> listings = carListingService.searchListings(q, pageable);
        return ResponseEntity.ok(listings);
    }

    @Operation(summary = "Filter listings", description = "Filter car listings by various criteria")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Filtered results retrieved successfully")
    })
    @GetMapping("/filter")
    public ResponseEntity<Page<CarListingDTO>> getListingsByFilters(
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage,
            @Parameter(description = "Car make") @RequestParam(required = false) String make,
            @Parameter(description = "Car model") @RequestParam(required = false) String model,
            @Parameter(description = "Pagination parameters") Pageable pageable) {

        logger.info("GET /api/v1/listings/filter - Filtering listings with criteria");
        Page<CarListingDTO> listings = carListingService.getListingsByFilters(
                minPrice, maxPrice, minYear, maxYear, minMileage, maxMileage, make, model, pageable);
        return ResponseEntity.ok(listings);
    }

    @Operation(summary = "Get latest listings", description = "Get the most recently posted active listings")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Latest listings retrieved successfully")
    })
    @GetMapping("/latest")
    public ResponseEntity<Page<CarListingDTO>> getLatestListings(
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/listings/latest - Fetching latest listings");
        Page<CarListingDTO> listings = carListingService.getLatestListings(pageable);
        return ResponseEntity.ok(listings);
    }

    @Operation(summary = "Get most viewed listings", description = "Get the most viewed active listings")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Most viewed listings retrieved successfully")
    })
    @GetMapping("/most-viewed")
    public ResponseEntity<Page<CarListingDTO>> getMostViewedListings(
            @Parameter(description = "Pagination parameters")
            Pageable pageable) {
        logger.info("GET /api/v1/listings/most-viewed - Fetching most viewed listings");
        Page<CarListingDTO> listings = carListingService.getMostViewedListings(pageable);
        return ResponseEntity.ok(listings);
    }

    @Operation(summary = "Get available makes", description = "Get all available car makes from active listings")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Available makes retrieved successfully")
    })
    @GetMapping("/makes")
    public ResponseEntity<List<String>> getAvailableMakes() {
        logger.info("GET /api/v1/listings/makes - Fetching available makes");
        List<String> makes = carListingService.getAvailableMakes();
        return ResponseEntity.ok(makes);
    }

    @Operation(summary = "Get available models by make", description = "Get all available models for a specific make")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Available models retrieved successfully")
    })
    @GetMapping("/models/{make}")
    public ResponseEntity<List<String>> getAvailableModelsByMake(
            @Parameter(description = "Car make", required = true)
            @PathVariable String make) {
        logger.info("GET /api/v1/listings/models/{} - Fetching available models for make", make);
        List<String> models = carListingService.getAvailableModelsByMake(make);
        return ResponseEntity.ok(models);
    }

    @Operation(summary = "Create a new listing", description = "Create a new car listing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Listing created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<CarListingDTO> createListing(
            @Parameter(description = "Car listing data", required = true)
            @Valid @RequestBody CarListingDTO listingDTO,
            Authentication authentication) {
        // The seller is always the signed-in user; the client cannot choose it.
        Long sellerId = ((SecurityConfig.CognitoPrincipal) authentication.getPrincipal()).getId();
        if (sellerId == null) {
            throw new IllegalArgumentException("No profile is linked to this account yet");
        }
        logger.info("POST /api/v1/listings - Creating new listing for seller ID: {}", sellerId);
        CarListingDTO createdListing = carListingService.createListing(listingDTO, sellerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdListing);
    }

    @Operation(summary = "Update listing", description = "Update an existing car listing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Listing updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "403", description = "Not the owner of this listing"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<CarListingDTO> updateListing(
            @Parameter(description = "Listing ID", required = true)
            @PathVariable Long id,
            @Parameter(description = "Updated listing data", required = true)
            @Valid @RequestBody CarListingDTO listingDTO,
            Authentication authentication) {
        logger.info("PUT /api/v1/listings/{} - Updating listing", id);
        CarListingDTO updatedListing = carListingService.updateListing(
                id, listingDTO, currentUserId(authentication), isAdmin(authentication));
        return ResponseEntity.ok(updatedListing);
    }

    @Operation(summary = "Update listing status", description = "Update the status of a car listing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Status updated successfully"),
            @ApiResponse(responseCode = "403", description = "Not the owner of this listing"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
    })
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<Void> updateListingStatus(
            @Parameter(description = "Listing ID", required = true)
            @PathVariable Long id,
            @Parameter(description = "New status", required = true)
            @RequestParam ListingStatus status,
            Authentication authentication) {
        logger.info("PATCH /api/v1/listings/{}/status - Updating status to {}", id, status);
        carListingService.updateListingStatus(id, status, currentUserId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Delete listing", description = "Delete a car listing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Listing deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Not the owner of this listing"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteListing(
            @Parameter(description = "Listing ID", required = true)
            @PathVariable Long id,
            Authentication authentication) {
        logger.info("DELETE /api/v1/listings/{} - Deleting listing", id);
        carListingService.deleteListing(id, currentUserId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get listing statistics", description = "Get listing statistics for dashboard")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    })
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getListingStats() {
        logger.info("GET /api/v1/listings/stats - Fetching listing statistics");

        Map<String, Object> stats = Map.of(
                "totalListings", carListingService.getTotalListingCount(),
                "activeListings", carListingService.getActiveListingCount(),
                "averagePrice", carListingService.getAveragePrice()
        );

        return ResponseEntity.ok(stats);
    }
}