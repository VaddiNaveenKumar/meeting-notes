// src/main/java/com/app/meetingnotes/dto/GenerateResponse.java
package com.app.meetingnotes.dto;

public class GenerateResponse {
    private Long transcriptId;
    private Long summaryId;
    private String summary;

    public GenerateResponse(Long transcriptId, Long summaryId, String summary) {
        this.transcriptId = transcriptId;
        this.summaryId = summaryId;
        this.summary = summary;
    }

    public Long getTranscriptId() { return transcriptId; }
    public Long getSummaryId() { return summaryId; }
    public String getSummary() { return summary; }
}
