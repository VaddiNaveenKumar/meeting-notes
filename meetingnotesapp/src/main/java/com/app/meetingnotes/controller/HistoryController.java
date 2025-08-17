package com.app.meetingnotes.controller;

import com.app.meetingnotes.model.Summary;
import com.app.meetingnotes.model.Transcript;
import com.app.meetingnotes.repo.SummaryRepository;
import com.app.meetingnotes.repo.TranscriptRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final SummaryRepository summaryRepo;
    private final TranscriptRepository transcriptRepo;

    public HistoryController(SummaryRepository summaryRepo, TranscriptRepository transcriptRepo) {
        this.summaryRepo = summaryRepo;
        this.transcriptRepo = transcriptRepo;
    }

    // Return current user's summaries only
    @GetMapping("/summaries")
    public ResponseEntity<List<Map<String,Object>>> listSummaries(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        String owner = (userId != null && !userId.isBlank()) ? userId : "anonymous";

        // Get transcripts for this user
        List<Transcript> userTranscripts = transcriptRepo.findByOwnerUserId(owner);
        Set<Long> transcriptIds = new HashSet<>();
        for (Transcript t : userTranscripts) transcriptIds.add(t.getId());

        // Fetch all summaries and filter by transcriptIds
        List<Summary> all = summaryRepo.findAll();
        List<Summary> mine = new ArrayList<>();
        for (Summary s : all) {
            if (transcriptIds.contains(s.getTranscriptId())) mine.add(s);
        }
        mine.sort(Comparator.comparing(Summary::getCreatedAt).reversed());

        // Build response with title and sharedTo
        Map<Long, Transcript> tMap = new HashMap<>();
        for (Transcript t : userTranscripts) tMap.put(t.getId(), t);

        List<Map<String,Object>> out = new ArrayList<>();
        for (Summary s : mine) {
            Transcript t = tMap.get(s.getTranscriptId());
            String title = t != null ? t.getTitle() : "Untitled";
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("summaryId", s.getId());
            row.put("title", title);
            row.put("createdAt", s.getCreatedAt());
            row.put("hasEdits", s.getEditedSummary() != null && !s.getEditedSummary().isBlank());
            row.put("sharedTo", s.getSharedTo() != null ? s.getSharedTo() : "");
            out.add(row);
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/summary/{id}")
    public ResponseEntity<Map<String,Object>> getSummary(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long id) {

        String owner = (userId != null && !userId.isBlank()) ? userId : "anonymous";

        Optional<Summary> sOpt = summaryRepo.findById(id);
        if (sOpt.isEmpty()) return ResponseEntity.notFound().build();
        Summary s = sOpt.get();

        Optional<Transcript> tOpt = transcriptRepo.findById(s.getTranscriptId());
        if (tOpt.isEmpty() || !owner.equals(tOpt.get().getOwnerUserId())) {
            // Prevent viewing someone else’s item
            return ResponseEntity.status(403).build();
        }

        Transcript t = tOpt.get();
        Map<String,Object> out = new LinkedHashMap<>();
        out.put("summaryId", s.getId());
        out.put("title", t.getTitle());
        out.put("createdAt", s.getCreatedAt());
        out.put("updatedAt", s.getUpdatedAt());
        out.put("summary", s.getEditedSummary() != null ? s.getEditedSummary() : s.getAiSummary());
        out.put("prompt", t.getPrompt());
        out.put("sharedTo", s.getSharedTo() != null ? s.getSharedTo() : "");
        return ResponseEntity.ok(out);
    }
}
