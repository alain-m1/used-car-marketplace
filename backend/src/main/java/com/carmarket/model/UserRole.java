// backend/src/main/java/com/carmarket/model/UserRole.java
package com.carmarket.model;

public enum UserRole {
    ADMIN("ADMIN"),
    SELLER("SELLER"),
    SHOPPER("SHOPPER");

    private final String name;

    UserRole(String name) {
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
