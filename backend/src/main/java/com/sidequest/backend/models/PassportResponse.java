package com.sidequest.backend.models;

import java.util.List;
import java.util.UUID;

public record PassportResponse(UUID userId, List<Stamp> stamps) {
    public record Stamp(
        UUID stampId,
        UUID adventureId,
        String title,
        String mode,
        String earnedAt,
        int stopCount
    ) {}
}
