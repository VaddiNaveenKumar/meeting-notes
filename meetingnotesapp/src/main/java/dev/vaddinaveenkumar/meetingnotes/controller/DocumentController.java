package dev.vaddinaveenkumar.meetingnotes.controller;

import org.apache.tika.Tika;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final Tika tika;

    public DocumentController() {
        this.tika = new Tika();
        // Sets a maximum string length for parsing, default is 100k, we set to -1 (unlimited)
        this.tika.setMaxStringLength(-1);
    }

    @PostMapping("/extract")
    public ResponseEntity<?> extractText(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        try (InputStream stream = file.getInputStream()) {
            // Tika automatically detects the file type (PDF, DOCX, etc.) and parses the text
            String extractedText = tika.parseToString(stream);
            
            return ResponseEntity.ok(Map.of(
                "filename", file.getOriginalFilename() != null ? file.getOriginalFilename() : "document",
                "text", extractedText
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to parse document: " + e.getMessage()));
        }
    }
}
