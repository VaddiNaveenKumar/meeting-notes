// src/main/java/com/app/meetingnotes/dto/UpdateSummaryRequest.java
package com.app.meetingnotes.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

public class UpdateSummaryRequest {
    @NotNull
    private Long summaryId;

    @NotBlank
    private String editedSummary;

    public Long getSummaryId() { return summaryId; }
    public void setSummaryId(Long summaryId) { this.summaryId = summaryId; }
    public String getEditedSummary() { return editedSummary; }
    public void setEditedSummary(String editedSummary) { this.editedSummary = editedSummary; }
}
