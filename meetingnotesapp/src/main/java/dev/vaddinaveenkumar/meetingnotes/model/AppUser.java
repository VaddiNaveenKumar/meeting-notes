package dev.vaddinaveenkumar.meetingnotes.model;

import jakarta.persistence.*;
import java.util.UUID;
import java.time.OffsetDateTime;

@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String email;

    @Column
    private String passwordHash;

    @Column(nullable = false)
    private boolean isAnonymous;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    public AppUser() {}

    public AppUser(boolean isAnonymous) {
        this.isAnonymous = isAnonymous;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public boolean isAnonymous() { return isAnonymous; }
    public void setAnonymous(boolean isAnonymous) { this.isAnonymous = isAnonymous; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
