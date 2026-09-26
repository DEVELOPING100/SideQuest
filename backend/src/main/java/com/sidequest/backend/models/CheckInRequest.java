package com.sidequest.backend.models;

import java.util.UUID;

public record CheckInRequest(UUID stopId, double lat, double lng) {}
