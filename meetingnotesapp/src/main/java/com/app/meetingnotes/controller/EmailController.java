package com.app.meetingnotes.controller;

import com.app.meetingnotes.dto.EmailRequest;
import com.app.meetingnotes.model.Summary;
import com.app.meetingnotes.model.Transcript;
import com.app.meetingnotes.repo.SummaryRepository;
import com.app.meetingnotes.repo.TranscriptRepository;
import com.app.meetingnotes.service.EmailService;
import com.app.meetingnotes.service.SummaryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.StringJoiner;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailService emailService;
    private final SummaryService summaryService;
    private final SummaryRepository summaryRepo;
    private final TranscriptRepository transcriptRepo;

    public EmailController(EmailService emailService,
                           SummaryService summaryService,
                           SummaryRepository summaryRepo,
                           TranscriptRepository transcriptRepo) {
        this.emailService = emailService;
        this.summaryService = summaryService;
        this.summaryRepo = summaryRepo;
        this.transcriptRepo = transcriptRepo;
    }

    @PostMapping("/send/{summaryId}")
    public ResponseEntity<String> send(@PathVariable Long summaryId,
                                       @Valid @RequestBody EmailRequest req) {
        // Load summary
        Summary s = summaryService.getById(summaryId);
        if (s == null) {
            return ResponseEntity.notFound().build();
        }

        // Determine title
        Transcript t = transcriptRepo.findById(s.getTranscriptId()).orElse(null);
        String title = (t != null && t.getTitle() != null && !t.getTitle().isBlank())
                ? t.getTitle()
                : "Meeting Summary";

        // Build content
        String innerHtml;
        if (req.getBodyHtml() != null && !req.getBodyHtml().isBlank()) {
            innerHtml = req.getBodyHtml();
        } else {
            String raw = s.getEditedSummary() != null ? s.getEditedSummary() : s.getAiSummary();
            innerHtml = emailService.wrapPlainTextBeautifully(raw);
        }

        // Enhance headings and lists for beautiful presentation
        innerHtml = emailService.enhanceStandardHeadings(innerHtml);
        // Optional: lightly style action rows if your content follows "Owner — Action — Due — Notes"
        innerHtml = emailService.styleActionRowsLightly(innerHtml);

        // Wrap with premium template
        String html = emailService.buildBrandedTemplate(title, innerHtml);

        // Subject default
        String subject = (req.getSubject() != null && !req.getSubject().isBlank()) ? req.getSubject() : title;

        // Send email
        emailService.sendHtmlEmail(req.getTo(), subject, html);

        // Store 'sharedTo' for History view
        StringJoiner joiner = new StringJoiner(", ");
        for (String addr : req.getTo()) {
            if (addr != null && !addr.isBlank()) joiner.add(addr.trim());
        }
        s.setSharedTo(joiner.toString());
        summaryRepo.save(s);

        return ResponseEntity.ok("Email sent");
    }
}
