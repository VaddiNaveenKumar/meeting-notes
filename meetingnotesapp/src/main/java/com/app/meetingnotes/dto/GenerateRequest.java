package com.app.meetingnotes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GenerateRequest {

    // 30MB characters is extremely large; JSON string length in chars
    // doesn’t map 1:1 to bytes but this protects the server memory roughly.
    // We’ll also add explicit byte-size validation in controller.
    @NotBlank
    @Size(max = 31_500_000, message = "Transcript too large. Please keep under 30MB.")
    private String transcriptText;

    @NotBlank
    @Size(max = 4000, message = "Prompt too long.")
    private String prompt;

    @Size(max = 255, message = "Title too long.")
    private String title;

    public String getTranscriptText() { return transcriptText; }
    public void setTranscriptText(String transcriptText) { this.transcriptText = transcriptText; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
