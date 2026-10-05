// backend/src/main/java/com/carmarket/config/JpaAuditingConfig.java
package com.carmarket.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA auditing lives here, not on {@code CarMarketplaceApplication}: an annotation on the
 * application class is picked up by {@code @WebMvcTest} slices, which have no JPA
 * metamodel and fail with "JPA metamodel must not be empty". Test slices skip
 * {@code @Configuration} classes, so the controller tests stay JPA-free.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
