// backend/src/main/java/com/carmarket/service/ImageStorageService.java
package com.carmarket.service;

import com.carmarket.config.AWSConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

/**
 * Stores listing photos in the S3 bucket. The bucket is private; browsers read the
 * objects through the CloudFront distribution (origin access control), so the URLs
 * handed back here point at the CloudFront domain, not at S3.
 */
@Service
public class ImageStorageService {

    private static final Logger logger = LoggerFactory.getLogger(ImageStorageService.class);

    static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp");

    private final S3Client s3Client;
    private final String bucketName;
    private final String cloudFrontDomain;

    @Autowired
    public ImageStorageService(S3Client s3Client, AWSConfig awsConfig,
                               @Value("${aws.s3.cloudfront-domain}") String cloudFrontDomain) {
        this.s3Client = s3Client;
        this.bucketName = awsConfig.getBucketName();
        // Accept either "d123.cloudfront.net" or a full https:// URL
        this.cloudFrontDomain = cloudFrontDomain.replaceFirst("^https?://", "").replaceAll("/+$", "");
    }

    /** Validates and uploads one image; returns its public CloudFront URL. */
    public String uploadListingImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Image must be 5 MB or smaller");
        }
        String contentType = file.getContentType();
        String extension = contentType == null ? null : EXTENSIONS.get(contentType.toLowerCase());
        if (extension == null) {
            throw new IllegalArgumentException("Only JPEG, PNG or WebP images are allowed");
        }

        String key = "listings/" + UUID.randomUUID() + "." + extension;
        try (InputStream in = file.getInputStream()) {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(contentType)
                            .cacheControl("public, max-age=31536000, immutable")
                            .build(),
                    RequestBody.fromInputStream(in, file.getSize()));
        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded image", e);
        }

        logger.info("Stored listing image s3://{}/{} ({} bytes)", bucketName, key, file.getSize());
        return "https://" + cloudFrontDomain + "/" + key;
    }
}
