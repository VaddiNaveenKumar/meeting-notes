package dev.vaddinaveenkumar.meetingnotes.controller;

import dev.vaddinaveenkumar.meetingnotes.dto.GenerateRequest;
import dev.vaddinaveenkumar.meetingnotes.dto.GenerateResponse;
import dev.vaddinaveenkumar.meetingnotes.dto.UpdateSummaryRequest;
import dev.vaddinaveenkumar.meetingnotes.model.Summary;
import dev.vaddinaveenkumar.meetingnotes.service.SummaryService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

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
            @org.springframework.security.core.annotation.AuthenticationPrincipal String jwtUserId,
            @Valid @RequestBody GenerateRequest req) {

        log.info("Generate called");

        if (req.transcriptText() != null && req.transcriptText().getBytes().length > MAX_BYTES) {
            return ResponseEntity.badRequest().body(new GenerateResponse(null, null,
                    "Transcript exceeds 30MB. Please reduce or split the file."));
        }

        String owner = (jwtUserId != null && !jwtUserId.isBlank()) ? jwtUserId : "anonymous";

        Summary s = summaryService.generateAndSave(
                req.transcriptText(),
                req.prompt(),
                req.title(),
                owner);
        return ResponseEntity.ok(new GenerateResponse(s.getTranscriptId(), s.getId(), s.getAiSummary()));
    }

    // FIX: Changed from APPLICATION_NDJSON_VALUE to TEXT_EVENT_STREAM_VALUE
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamGenerate(
            @org.springframework.security.core.annotation.AuthenticationPrincipal String jwtUserId,
            @Valid @RequestBody GenerateRequest req) {

        log.info("Stream Generate called");

        SseEmitter emitter = new SseEmitter(180_000L); // 3 minutes timeout

        if (req.transcriptText() != null && req.transcriptText().getBytes().length > MAX_BYTES) {
            try {
                emitter.send("Error: Transcript exceeds 30MB.");
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        String owner = (jwtUserId != null && !jwtUserId.isBlank()) ? jwtUserId : "anonymous";

        AtomicReference<UUID> transcriptIdRef = new AtomicReference<>();
        AtomicReference<UUID> summaryIdRef = new AtomicReference<>();

        Flux<String> summaryStream = summaryService.streamGenerateAndSave(
                req.transcriptText(),
                req.prompt(),
                req.title(),
                owner,
                transcriptIdRef,
                summaryIdRef);

        String idMeta = String.format("{\"___META___\":true,\"transcriptId\":\"%s\",\"summaryId\":\"%s\"}",
                transcriptIdRef.get(), summaryIdRef.get());

        try {
            emitter.send(idMeta);
        } catch (Exception e) {
            emitter.completeWithError(e);
            return emitter;
        }

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        summaryStream.subscribe(
            chunk -> {
                try {
                    String jsonChunk = mapper.writeValueAsString(chunk);
                    emitter.send(jsonChunk);
                } catch (Exception e) {
                    emitter.completeWithError(e);
                }
            },
            error -> emitter.completeWithError(error),
            () -> emitter.complete()
        );

        return emitter;
    }

    @PutMapping("/{id}")
    public ResponseEntity<GenerateResponse> updateSummary(
            @org.springframework.security.core.annotation.AuthenticationPrincipal String jwtUserId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSummaryRequest req) {
        Summary s = summaryService.updateEditedSummary(id, req.editedSummary(), jwtUserId != null ? jwtUserId : "anonymous");
        return ResponseEntity.ok(new GenerateResponse(s.getTranscriptId(), s.getId(),
                s.getEditedSummary() != null ? s.getEditedSummary() : s.getAiSummary()));
    }

    @GetMapping("/{summaryId}")
    public ResponseEntity<GenerateResponse> get(
            @org.springframework.security.core.annotation.AuthenticationPrincipal String jwtUserId,
            @PathVariable UUID summaryId) {
        Summary s = summaryService.getById(summaryId, jwtUserId != null ? jwtUserId : "anonymous");
        if (s == null)
            return ResponseEntity.notFound().build();
        String text = s.getEditedSummary() != null ? s.getEditedSummary() : s.getAiSummary();
        return ResponseEntity.ok(new GenerateResponse(s.getTranscriptId(), s.getId(), text));
    }
}