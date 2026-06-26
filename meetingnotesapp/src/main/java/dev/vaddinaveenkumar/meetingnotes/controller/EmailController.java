package dev.vaddinaveenkumar.meetingnotes.controller;

import dev.vaddinaveenkumar.meetingnotes.dto.EmailRequest;
import dev.vaddinaveenkumar.meetingnotes.model.Summary;
import dev.vaddinaveenkumar.meetingnotes.model.Transcript;
import dev.vaddinaveenkumar.meetingnotes.repo.SummaryRepository;
import dev.vaddinaveenkumar.meetingnotes.repo.TranscriptRepository;
import dev.vaddinaveenkumar.meetingnotes.service.EmailService;
import dev.vaddinaveenkumar.meetingnotes.service.SummaryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.StringJoiner;
import java.util.UUID;

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
    public ResponseEntity<String> send(@PathVariable UUID summaryId,
                                       @org.springframework.security.core.annotation.AuthenticationPrincipal String jwtUserId,
                                       @Valid @RequestBody EmailRequest req) {
        // Load summary
        Summary s = summaryService.getById(summaryId, jwtUserId != null ? jwtUserId : "anonymous");
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
        if (req.bodyHtml() != null && !req.bodyHtml().isBlank()) {
            innerHtml = req.bodyHtml();
        } else {
            String raw = s.getEditedSummary() != null ? s.getEditedSummary() : s.getAiSummary();
            innerHtml = emailService.wrapPlainTextBeautifully(raw);
        }

        // Inject premium inline CSS into the HTML tags so it renders beautifully in email clients
        innerHtml = emailService.applyInlineStyles(innerHtml);

        // Wrap with premium template
        String html = emailService.buildBrandedTemplate(title, innerHtml);

        // Subject default
        String subject = (req.subject() != null && !req.subject().isBlank()) ? req.subject() : title;

        // Send email
        emailService.sendHtmlEmail(req.to(), subject, html);

        // Store 'sharedTo' for History view
        StringJoiner joiner = new StringJoiner(", ");
        for (String addr : req.to()) {
            if (addr != null && !addr.isBlank()) joiner.add(addr.trim());
        }
        s.setSharedTo(joiner.toString());
        summaryRepo.save(s);

        return ResponseEntity.ok("Email sent");
    }
}
