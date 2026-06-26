package dev.vaddinaveenkumar.meetingnotes.repo;

import dev.vaddinaveenkumar.meetingnotes.model.Transcript;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import java.util.UUID;

public interface TranscriptRepository extends JpaRepository<Transcript, UUID> {
    List<Transcript> findByOwnerUserId(String ownerUserId);
}
