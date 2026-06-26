package dev.vaddinaveenkumar.meetingnotes.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record UpdateSummaryRequest(
        @NotNull UUID summaryId,
        @NotBlank String editedSummary
) {}
