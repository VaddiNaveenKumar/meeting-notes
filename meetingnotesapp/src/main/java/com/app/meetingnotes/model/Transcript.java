package com.app.meetingnotes.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transcripts")
public class Transcript {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // LONGTEXT supports up to 4GB; safe for 30MB payloads
    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 128)
    private String ownerUserId;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    public Transcript() {}

    public Transcript(String content, String prompt, String title, String ownerUserId) {
        this.content = content;
        this.prompt = prompt;
        this.title = title;
        this.ownerUserId = ownerUserId;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(String ownerUserId) { this.ownerUserId = ownerUserId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
