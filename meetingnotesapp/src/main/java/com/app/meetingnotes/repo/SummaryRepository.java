// src/main/java/com/app/meetingnotes/repo/SummaryRepository.java
package com.app.meetingnotes.repo;

import com.app.meetingnotes.model.Summary;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SummaryRepository extends JpaRepository<Summary, Long> {
    Summary findTopByTranscriptIdOrderByCreatedAtDesc(Long transcriptId);
}
