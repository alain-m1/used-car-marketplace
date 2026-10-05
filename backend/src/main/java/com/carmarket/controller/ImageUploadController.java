// backend/src/main/java/com/carmarket/controller/ImageUploadController.java
package com.carmarket.controller;

import com.carmarket.service.ImageStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/uploads")
@Tag(name = "Uploads", description = "Listing image uploads to S3")
public class ImageUploadController {

    private static final Logger logger = LoggerFactory.getLogger(ImageUploadController.class);

    private final ImageStorageService imageStorageService;

    @Autowired
    public ImageUploadController(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @Operation(summary = "Upload a listing image",
            description = "Stores one JPEG/PNG/WebP image (max 5 MB) in S3 and returns its CloudFront URL")
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(
            @Parameter(description = "Image file", required = true)
            @RequestPart("file") MultipartFile file) {
        logger.info("POST /api/v1/uploads/images - {} ({} bytes)", file.getOriginalFilename(), file.getSize());
        String url = imageStorageService.uploadListingImage(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", url));
    }
}
