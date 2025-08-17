package com.app.meetingnotes.service;

import com.app.meetingnotes.model.Summary;
import com.app.meetingnotes.model.Transcript;
import com.app.meetingnotes.repo.SummaryRepository;
import com.app.meetingnotes.repo.TranscriptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SummaryService {

    private static final Logger log = LoggerFactory.getLogger(SummaryService.class);

    private final TranscriptRepository transcriptRepository;
    private final SummaryRepository summaryRepository;
    private final GroqService groqService;

    public SummaryService(TranscriptRepository transcriptRepository,
                          SummaryRepository summaryRepository,
                          GroqService groqService) {
        this.transcriptRepository = transcriptRepository;
        this.summaryRepository = summaryRepository;
        this.groqService = groqService;
    }

    @Transactional
    public Summary generateAndSave(String transcriptText, String prompt, String title, String ownerUserId) {
        log.debug("Saving transcript...");
        String finalTitle = (title != null && !title.isBlank()) ? title.trim() : deriveTitle(transcriptText);
        Transcript t = new Transcript(transcriptText, prompt, finalTitle, ownerUserId);
        t = transcriptRepository.save(t);

        log.debug("Calling Groq summarization...");
        String aiSummary = groqService.generateSummary(transcriptText, prompt);

        log.debug("Saving summary...");
        Summary s = new Summary(t.getId(), aiSummary);
        return summaryRepository.save(s);
    }

    private String deriveTitle(String text) {
        String trimmed = text == null ? "" : text.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty()) return "Untitled";
        return trimmed.length() > 60 ? trimmed.substring(0, 60) + "..." : trimmed;
        }

    @Transactional
    public Summary updateEditedSummary(Long summaryId, String editedSummary) {
        Summary s = summaryRepository.findById(summaryId)
                .orElseThrow(() -> new RuntimeException("Summary not found"));
        s.setEditedSummary(editedSummary);
        s.setUpdatedAt(java.time.OffsetDateTime.now());
        return summaryRepository.save(s);
    }

    public Summary getById(Long id) {
        return summaryRepository.findById(id).orElse(null);
    }
}
