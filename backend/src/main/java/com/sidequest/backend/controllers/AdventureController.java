package com.sidequest.backend.controllers;

import com.sidequest.backend.models.AdventureDetailsResponse;
import com.sidequest.backend.models.AdventureResponse;
import com.sidequest.backend.models.CheckInRequest;
import com.sidequest.backend.models.CheckInResponse;
import com.sidequest.backend.models.GenerateAdventureRequest;
import com.sidequest.backend.services.AdventureService;
import com.sidequest.backend.services.SupabaseAdventureService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/adventures")
public class AdventureController {

    private final AdventureService adventureService;
    private final SupabaseAdventureService supabaseAdventureService;

    public AdventureController(
        AdventureService adventureService,
        SupabaseAdventureService supabaseAdventureService
    ) {
        this.adventureService = adventureService;
        this.supabaseAdventureService = supabaseAdventureService;
    }

    @PostMapping("/generate")
    public AdventureResponse generateAdventure(@RequestBody GenerateAdventureRequest request) {
        return adventureService.generate(request);
    }

    @GetMapping("/{adventureId}")
    public AdventureDetailsResponse getAdventure(@PathVariable UUID adventureId) {
        return supabaseAdventureService.findAdventure(adventureId);
    }

    @PostMapping("/{adventureId}/checkin")
    public CheckInResponse checkIn(
        @PathVariable UUID adventureId,
        @RequestBody CheckInRequest request
    ) {
        return supabaseAdventureService.checkIn(adventureId, request);
    }
}
