package com.app.meetingnotes.controller;

import com.app.meetingnotes.dto.GenerateRequest;
import com.app.meetingnotes.dto.GenerateResponse;
import com.app.meetingnotes.dto.UpdateSummaryRequest;
import com.app.meetingnotes.model.Summary;
import com.app.meetingnotes.service.SummaryService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/summary")
public class SummaryController {

    private static final Logger log = LoggerFactory.getLogger(SummaryController.class);
    private static final int MAX_BYTES = 30 * 1024 * 1024; // 30MB

    private final SummaryService summaryService;

    public SummaryController(SummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @PostMapping("/generate")
    public ResponseEntity<GenerateResponse> generate(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody GenerateRequest req) {

        log.info("Generate called");

        // Explicit size guard (approx by char length; JSON/post decoding already occurred)
        // For multi-byte chars this is approximate; still prevents runaway inputs.
        if (req.getTranscriptText() != null && req.getTranscriptText().getBytes().length > MAX_BYTES) {
            return ResponseEntity.badRequest().body(new GenerateResponse(null, null,
                    "Transcript exceeds 30MB. Please reduce or split the file."));
        }

        String owner = (userId != null && !userId.isBlank()) ? userId : "anonymous";

        Summary s = summaryService.generateAndSave(
                req.getTranscriptText(),
                req.getPrompt(),
                req.getTitle(),
                owner
        );
        return ResponseEntity.ok(new GenerateResponse(s.getTranscriptId(), s.getId(), s.getAiSummary()));
    }

    @PutMapping("/update")
    public ResponseEntity<GenerateResponse> updateEdited(@Valid @RequestBody UpdateSummaryRequest req) {
        Summary s = summaryService.updateEditedSummary(req.getSummaryId(), req.getEditedSummary());
        return ResponseEntity.ok(new GenerateResponse(s.getTranscriptId(), s.getId(),
                s.getEditedSummary() != null ? s.getEditedSummary() : s.getAiSummary()));
    }

    @GetMapping("/{summaryId}")
    public ResponseEntity<GenerateResponse> get(@PathVariable Long summaryId) {
        Summary s = summaryService.getById(summaryId);
        if (s == null) return ResponseEntity.notFound().build();
        String text = s.getEditedSummary() != null ? s.getEditedSummary() : s.getAiSummary();
        return ResponseEntity.ok(new GenerateResponse(s.getTranscriptId(), s.getId(), text));
    }
}
