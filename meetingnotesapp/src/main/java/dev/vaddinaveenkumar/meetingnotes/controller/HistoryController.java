package dev.vaddinaveenkumar.meetingnotes.controller;

import dev.vaddinaveenkumar.meetingnotes.model.Summary;
import dev.vaddinaveenkumar.meetingnotes.model.Transcript;
import dev.vaddinaveenkumar.meetingnotes.repo.SummaryRepository;
import dev.vaddinaveenkumar.meetingnotes.repo.TranscriptRepository;
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
    public ResponseEntity<?> listSummaries(
            @org.springframework.security.core.annotation.AuthenticationPrincipal String jwtUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String owner = (jwtUserId != null && !jwtUserId.isBlank()) ? jwtUserId : "anonymous";

            // Get transcripts for this user
            List<Transcript> userTranscripts = transcriptRepo.findByOwnerUserId(owner);
            Set<UUID> transcriptIds = new HashSet<>();
            for (Transcript t : userTranscripts) transcriptIds.add(t.getId());
            
            if (transcriptIds.isEmpty()) {
                return ResponseEntity.ok(Map.of("content", Collections.emptyList(), "last", true));
            }

            // Fetch paginated summaries
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
            org.springframework.data.domain.Page<Summary> paged = summaryRepo.findByTranscriptIdInOrderByCreatedAtDesc(transcriptIds, pageable);

            // Build response with title and sharedTo
            Map<UUID, Transcript> tMap = new HashMap<>();
            for (Transcript t : userTranscripts) tMap.put(t.getId(), t);

            List<Map<String,Object>> out = new ArrayList<>();
            for (Summary s : paged.getContent()) {
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
            
            Map<String,Object> response = new HashMap<>();
            response.put("content", out);
            response.put("last", paged.isLast());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(e.getMessage() + " | Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "null"));
        }
    }

    @GetMapping("/summary/{id}")
    public ResponseEntity<Map<String,Object>> getSummary(
            @org.springframework.security.core.annotation.AuthenticationPrincipal String jwtUserId,
            @PathVariable UUID id) {

        String owner = (jwtUserId != null && !jwtUserId.isBlank()) ? jwtUserId : "anonymous";

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
