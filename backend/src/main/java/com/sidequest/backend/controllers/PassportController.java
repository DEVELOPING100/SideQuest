package com.sidequest.backend.controllers;

import com.sidequest.backend.models.PassportResponse;
import com.sidequest.backend.services.SupabaseAdventureService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/passport")
public class PassportController {

    private final SupabaseAdventureService supabaseAdventureService;

    public PassportController(SupabaseAdventureService supabaseAdventureService) {
        this.supabaseAdventureService = supabaseAdventureService;
    }

    @GetMapping
    public PassportResponse getPassport() {
        return supabaseAdventureService.getPassport();
    }
}
