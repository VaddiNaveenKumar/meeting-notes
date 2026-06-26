package dev.vaddinaveenkumar.meetingnotes.service;

import dev.vaddinaveenkumar.meetingnotes.model.Summary;
import dev.vaddinaveenkumar.meetingnotes.model.Transcript;
import dev.vaddinaveenkumar.meetingnotes.repo.SummaryRepository;
import dev.vaddinaveenkumar.meetingnotes.repo.TranscriptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class SummaryService {

    private static final Logger log = LoggerFactory.getLogger(SummaryService.class);

    private final TranscriptRepository transcriptRepository;
    private final SummaryRepository summaryRepository;
    private final GeminiService geminiService;

    public SummaryService(TranscriptRepository transcriptRepository,
                          SummaryRepository summaryRepository,
                          GeminiService geminiService) {
        this.transcriptRepository = transcriptRepository;
        this.summaryRepository = summaryRepository;
        this.geminiService = geminiService;
    }

    @Transactional
    public Summary generateAndSave(String transcriptText, String prompt, String title, String ownerUserId) {
        log.debug("Saving transcript...");
        String finalTitle = (title != null && !title.isBlank()) ? title.trim() : deriveTitle(transcriptText);
        Transcript t = new Transcript(transcriptText, prompt, finalTitle, ownerUserId);
        t = transcriptRepository.save(t);

        String aiSummary = geminiService.generateSummary(transcriptText, prompt);

        log.debug("Saving summary...");
        Summary s = new Summary(t.getId(), aiSummary);
        return summaryRepository.save(s);
    }

    private String deriveTitle(String text) {
        String trimmed = text == null ? "" : text.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty()) return "Untitled";
        return trimmed.length() > 60 ? trimmed.substring(0, 60) + "..." : trimmed;
    }

    public Flux<String> streamGenerateAndSave(String transcriptText, String prompt, String title, String ownerUserId, AtomicReference<UUID> outTranscriptId, AtomicReference<UUID> outSummaryId) {
        String finalTitle = (title != null && !title.isBlank()) ? title.trim() : deriveTitle(transcriptText);
        Transcript t = new Transcript(transcriptText, prompt, finalTitle, ownerUserId);
        Transcript savedTranscript = transcriptRepository.save(t);
        outTranscriptId.set(savedTranscript.getId());

        StringBuilder fullSummary = new StringBuilder();
        
        // Initial empty summary record so we can give ID to frontend immediately?
        // Actually, better to just let frontend saveEdits if they want, but the requirement is to save when stream ends.
        // Let's create an empty summary so we have an ID for the frontend.
        Summary s = new Summary(savedTranscript.getId(), "");
        Summary savedSummary = summaryRepository.save(s);
        outSummaryId.set(savedSummary.getId());

        return geminiService.streamSummary(transcriptText, prompt)
                .doOnNext(fullSummary::append)
                .onErrorResume(e -> {
                    log.error("Error in Gemini summary stream: ", e);
                    return Flux.just("\n[Error during generation: " + e.getMessage() + "]");
                })
                .publishOn(reactor.core.scheduler.Schedulers.boundedElastic())
                .doOnComplete(() -> {
                    try {
                        Summary currentSummary = summaryRepository.findById(savedSummary.getId())
                                .orElse(savedSummary);
                        currentSummary.setAiSummary(fullSummary.toString());
                        summaryRepository.save(currentSummary);
                    } catch (Exception e) {
                        log.error("Failed to save final summary to database: ", e);
                    }
                });
    }

    @Transactional
    public Summary updateEditedSummary(UUID summaryId, String editedSummary, String ownerUserId) {
        Summary s = summaryRepository.findById(summaryId)
                .orElseThrow(() -> new RuntimeException("Summary not found"));
        
        Transcript t = transcriptRepository.findById(s.getTranscriptId())
                .orElseThrow(() -> new RuntimeException("Transcript not found"));
        if (!ownerUserId.equals(t.getOwnerUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access Denied");
        }
        
        s.setEditedSummary(editedSummary);
        s.setUpdatedAt(java.time.OffsetDateTime.now());
        return summaryRepository.save(s);
    }

    public Summary getById(UUID id, String ownerUserId) {
        Summary s = summaryRepository.findById(id).orElse(null);
        if (s != null) {
            Transcript t = transcriptRepository.findById(s.getTranscriptId()).orElse(null);
            if (t == null || !ownerUserId.equals(t.getOwnerUserId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied");
            }
        }
        return s;
    }
}
