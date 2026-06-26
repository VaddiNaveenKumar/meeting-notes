package dev.vaddinaveenkumar.meetingnotes.controller;

import dev.vaddinaveenkumar.meetingnotes.service.NotionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notion")
public class NotionController {

    private final NotionService notionService;

    public NotionController(NotionService notionService) {
        this.notionService = notionService;
    }

    @PostMapping("/auth")
    public ResponseEntity<?> authenticate(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required."));
        }
        try {
            String token = notionService.exchangeCode(code);
            return ResponseEntity.ok(Map.of("access_token", token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/pages")
    public ResponseEntity<?> fetchPages(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Notion Access Token is required."));
        }
        try {
            return ResponseEntity.ok(Map.of("pages", notionService.fetchPages(token)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/export")
    public ResponseEntity<?> exportToNotion(@RequestBody Map<String, String> request) {
        String pageId = request.get("pageId");
        String token = request.get("token");
        String markdownContent = request.get("markdownContent");

        if (pageId == null || pageId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Notion Page ID is required."));
        }
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Notion Integration Token is required."));
        }
        if (markdownContent == null || markdownContent.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content is empty."));
        }

        try {
            notionService.appendToPage(pageId, token, markdownContent);
            return ResponseEntity.ok(Map.of("message", "Successfully exported to Notion!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
