package com.sidequest.backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException error) {
        return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
    }

    @ExceptionHandler({IllegalStateException.class, RestClientException.class})
    public ResponseEntity<Map<String, String>> handleIntegrationError(RuntimeException error) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(Map.of("error", error.getMessage()));
    }
}
