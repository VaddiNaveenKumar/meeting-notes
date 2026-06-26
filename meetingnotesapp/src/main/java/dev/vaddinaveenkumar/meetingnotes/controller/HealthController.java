package dev.vaddinaveenkumar.meetingnotes.controller;

import dev.vaddinaveenkumar.meetingnotes.repo.TranscriptRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final TranscriptRepository repo;

    public HealthController(TranscriptRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<String> health() {
        long count = repo.count();
        return ResponseEntity.ok("OK dbCount=" + count + " model=gemini-2.5-flash");
    }
}
