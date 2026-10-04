// backend/src/main/java/com/carmarket/config/AWSConfig.java
package com.carmarket.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;

import java.net.URI;

@Configuration
public class AWSConfig {

    private static final Logger logger = LoggerFactory.getLogger(AWSConfig.class);

    @Value("${aws.region:us-east-2}")
    private String region;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    // Only used by the dev profile (LocalStack container on the compose network)
    @Value("${aws.s3.endpoint:http://car-marketplace-s3-mock:4566}")
    private String s3Endpoint;

    @Value("${aws.cognito.user-pool-id}")
    private String userPoolId;

    @Value("${aws.cognito.client-id}")
    private String clientId;

    // Default chain: ECS task role (container credentials endpoint) in AWS,
    // env vars / ~/.aws profile locally. No static keys outside the dev/test profiles.
    @Bean(destroyMethod = "close")
    @Profile("!test & !dev")
    public S3Client amazonS3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    // Local dev: talk to the LocalStack container instead of AWS. Path-style
    // addressing is required because bucket.hostname does not resolve in Docker.
    @Bean(destroyMethod = "close")
    @Profile("dev")
    public S3Client localS3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .endpointOverride(URI.create(s3Endpoint))
                .forcePathStyle(true)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("test", "test")))
                .build();
    }

    // Local dev: make sure the bucket exists in LocalStack. LocalStack can still be
    // booting when the backend is ready, so retry briefly and never fail startup.
    @Bean
    @Profile("dev")
    public LocalBucketInitializer localBucketInitializer(S3Client localS3Client) {
        return new LocalBucketInitializer(localS3Client, bucketName);
    }

    public static class LocalBucketInitializer {
        private final S3Client s3;
        private final String bucket;

        LocalBucketInitializer(S3Client s3, String bucket) {
            this.s3 = s3;
            this.bucket = bucket;
        }

        @EventListener(ApplicationReadyEvent.class)
        public void ensureBucket() {
            for (int attempt = 1; attempt <= 5; attempt++) {
                try {
                    try {
                        s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
                    } catch (NoSuchBucketException e) {
                        s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
                        logger.info("Created local S3 bucket '{}'", bucket);
                    }
                    return;
                } catch (Exception e) {
                    logger.warn("Local S3 bucket check failed (attempt {}/5): {}", attempt, e.getMessage());
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
            }
        }
    }

    @Bean(destroyMethod = "close")
    @Profile("!test")
    public CognitoIdentityProviderClient cognitoClient() {
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    @Bean(destroyMethod = "close")
    @Profile("test")
    public S3Client mockS3Client() {
        // Offline client for testing; dummy credentials are never sent anywhere
        return S3Client.builder()
                .region(Region.US_EAST_2)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("test", "test")))
                .build();
    }

    @Bean(destroyMethod = "close")
    @Profile("test")
    public CognitoIdentityProviderClient mockCognitoClient() {
        // Offline client for testing; dummy credentials are never sent anywhere
        return CognitoIdentityProviderClient.builder()
                .region(Region.US_EAST_2)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("test", "test")))
                .build();
    }

    public String getBucketName() {
        return bucketName;
    }

    public String getUserPoolId() {
        return userPoolId;
    }

    public String getClientId() {
        return clientId;
    }

    public String getRegion() {
        return region;
    }
}
