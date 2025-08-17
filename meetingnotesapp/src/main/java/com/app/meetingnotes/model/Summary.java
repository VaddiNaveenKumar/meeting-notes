package com.app.meetingnotes.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "summaries")
public class Summary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private Long transcriptId;

    // LONGTEXT so very large AI outputs or edits are safe
    @Lob
    @Column(nullable=false, columnDefinition = "LONGTEXT")
    private String aiSummary;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String editedSummary;

    @Column(length = 1024)
    private String sharedTo;

    @Column(nullable=false)
    private OffsetDateTime createdAt;

    @Column
    private OffsetDateTime updatedAt;

    public Summary() {}

    public Summary(Long transcriptId, String aiSummary) {
        this.transcriptId = transcriptId;
        this.aiSummary = aiSummary;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Long getTranscriptId() { return transcriptId; }
    public void setTranscriptId(Long transcriptId) { this.transcriptId = transcriptId; }
    public String getAiSummary() { return aiSummary; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }
    public String getEditedSummary() { return editedSummary; }
    public void setEditedSummary(String editedSummary) { this.editedSummary = editedSummary; }
    public String getSharedTo() { return sharedTo; }
    public void setSharedTo(String sharedTo) { this.sharedTo = sharedTo; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
