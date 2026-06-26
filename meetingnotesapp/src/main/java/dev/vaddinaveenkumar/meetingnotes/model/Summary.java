package dev.vaddinaveenkumar.meetingnotes.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "summaries")
public class Summary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable=false)
    private UUID transcriptId;

    // TEXT so very large AI outputs or edits are safe
    @Column(nullable=false, columnDefinition = "TEXT")
    private String aiSummary;

    @Column(columnDefinition = "TEXT")
    private String editedSummary;

    @Column(length = 1024)
    private String sharedTo;

    @Column(nullable=false)
    private OffsetDateTime createdAt;

    @Column
    private OffsetDateTime updatedAt;

    public Summary() {}

    public Summary(UUID transcriptId, String aiSummary) {
        this.transcriptId = transcriptId;
        this.aiSummary = aiSummary;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public UUID getTranscriptId() { return transcriptId; }
    public void setTranscriptId(UUID transcriptId) { this.transcriptId = transcriptId; }
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
