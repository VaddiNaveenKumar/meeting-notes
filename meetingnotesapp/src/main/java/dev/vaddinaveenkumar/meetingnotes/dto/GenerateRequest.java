package dev.vaddinaveenkumar.meetingnotes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateRequest(
        @NotBlank
        @Size(max = 31_500_000, message = "Transcript too large. Please keep under 30MB.")
        String transcriptText,

        @NotBlank
        @Size(max = 4000, message = "Prompt too long.")
        String prompt,

        @Size(max = 255, message = "Title too long.")
        String title
) {}
