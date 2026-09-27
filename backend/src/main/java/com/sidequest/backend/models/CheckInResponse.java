package com.sidequest.backend.models;

import java.time.Instant;
import java.util.UUID;

public record CheckInResponse(boolean success, UUID stopId, Instant completedAt) {}
