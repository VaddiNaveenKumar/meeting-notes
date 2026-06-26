// src/main/java/dev.vaddinaveenkumar.meetingnotes/repo/SummaryRepository.java
package dev.vaddinaveenkumar.meetingnotes.repo;

import dev.vaddinaveenkumar.meetingnotes.model.Summary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SummaryRepository extends JpaRepository<Summary, UUID> {
    Summary findTopByTranscriptIdOrderByCreatedAtDesc(UUID transcriptId);
    org.springframework.data.domain.Page<Summary> findByTranscriptIdInOrderByCreatedAtDesc(java.util.Collection<UUID> transcriptIds, org.springframework.data.domain.Pageable pageable);
}
