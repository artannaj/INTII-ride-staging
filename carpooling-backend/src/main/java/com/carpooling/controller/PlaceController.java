package com.carpooling.controller;

import com.carpooling.dto.PlaceRequest;
import com.carpooling.dto.PlaceResponse;
import com.carpooling.service.PlaceService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @GetMapping
    public ResponseEntity<List<PlaceResponse>> list(Authentication authentication) {
        return ResponseEntity.ok(placeService.list(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<PlaceResponse> create(
            Authentication authentication,
            @RequestBody PlaceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(placeService.create(authentication.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaceResponse> update(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody PlaceRequest request
    ) {
        return ResponseEntity.ok(placeService.update(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable Long id
    ) {
        placeService.delete(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}