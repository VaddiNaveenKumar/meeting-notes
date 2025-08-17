package com.app.meetingnotes.controller;

import com.app.meetingnotes.repo.TranscriptRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final TranscriptRepository repo;

    @Value("${app.groq.model}")
    private String model;

    public HealthController(TranscriptRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<String> health() {
        long count = repo.count();
        return ResponseEntity.ok("OK dbCount=" + count + " model=" + model);
    }
}
