package com.app.meetingnotes.repo;

import com.app.meetingnotes.model.Transcript;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TranscriptRepository extends JpaRepository<Transcript, Long> {
    List<Transcript> findByOwnerUserId(String ownerUserId);
}
