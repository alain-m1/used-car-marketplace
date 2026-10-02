// backend/src/main/java/com/carmarket/model/ListingStatus.java
package com.carmarket.model;

public enum ListingStatus {
    ACTIVE("ACTIVE"),
    SOLD("SOLD"),
    PENDING("PENDING"),
    INACTIVE("INACTIVE");

    private final String name;

    ListingStatus(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    @Override
    public String toString() {
        return name;
    }
}
