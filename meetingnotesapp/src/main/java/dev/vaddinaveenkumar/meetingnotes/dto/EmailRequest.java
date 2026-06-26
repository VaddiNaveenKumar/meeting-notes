package dev.vaddinaveenkumar.meetingnotes.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record EmailRequest(
        @NotEmpty List<@Email String> to,
        String subject,
        String bodyHtml
) {}
