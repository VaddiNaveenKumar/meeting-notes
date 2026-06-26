package dev.vaddinaveenkumar.meetingnotes.dto;

import java.util.UUID;

public record GenerateResponse(
        UUID transcriptId,
        UUID summaryId,
        String summary
) {}
