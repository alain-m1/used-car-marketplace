// backend/src/main/java/com/carmarket/CarMarketplaceApplication.java
package com.carmarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableAsync
public class CarMarketplaceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarMarketplaceApplication.class, args);
    }
}
