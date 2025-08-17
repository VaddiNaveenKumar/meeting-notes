// src/main/java/com/app/meetingnotes/dto/EmailRequest.java
package com.app.meetingnotes.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class EmailRequest {

    @NotEmpty
    private List<@Email String> to;

    @NotBlank
    private String subject;

    @NotBlank
    private String bodyHtml;

    public List<String> getTo() { return to; }
    public void setTo(List<String> to) { this.to = to; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBodyHtml() { return bodyHtml; }
    public void setBodyHtml(String bodyHtml) { this.bodyHtml = bodyHtml; }
}
