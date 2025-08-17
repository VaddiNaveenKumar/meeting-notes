package com.app.meetingnotes.service;

import com.google.gson.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.*;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);

    @Value("${app.groq.api-key}")
    private String groqApiKey;

    @Value("${app.groq.model}")
    private String defaultModel;

    private static final String GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate;

    @Autowired
    public GroqService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String generateSummary(String transcript, String userInstruction) {
        String model = defaultModel;
        double temperature = 0.25; // stable, concise

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("temperature", temperature);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", getSystemPromptTemplate()));
        messages.add(Map.of("role", "user", "content", "Instruction:\n" + userInstruction + "\n\nTranscript:\n" + transcript));
        body.put("messages", messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        int maxRetries = 2;
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<String> res = restTemplate.postForEntity(GROQ_CHAT_URL, entity, String.class);
                if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                    throw new RuntimeException("Groq API error " + res.getStatusCode() + ": " + (res.getBody() == null ? "<no body>" : res.getBody()));
                }
                JsonObject root = JsonParser.parseString(res.getBody()).getAsJsonObject();
                JsonArray choices = root.getAsJsonArray("choices");
                if (choices == null || choices.size() == 0) {
                    throw new RuntimeException("No choices returned by Groq.");
                }
                JsonObject first = choices.get(0).getAsJsonObject();
                JsonObject message = first.getAsJsonObject("message");
                return message.get("content").getAsString();
            } catch (HttpStatusCodeException httpEx) {
                int status = httpEx.getStatusCode().value();
                String bodyText = httpEx.getResponseBodyAsString();
                log.warn("Groq call failed (status={} attempt={}): {}", status, attempt, bodyText);
                if (status >= 500 && attempt < maxRetries) {
                    sleep(500L * (attempt + 1));
                    continue;
                }
                throw new RuntimeException("Groq API error " + status + ": " + bodyText, httpEx);
            } catch (Exception ex) {
                log.warn("Groq call error (attempt={}): {}", attempt, ex.toString());
                if (attempt < maxRetries) {
                    sleep(500L * (attempt + 1));
                    continue;
                }
                throw new RuntimeException("Groq API request failed: " + ex.getMessage(), ex);
            }
        }
        throw new RuntimeException("Unexpected Groq error.");
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }

    private String getSystemPromptTemplate() {
        // Key: adaptive depth/length based on transcript length and complexity
        return String.join("\n",
            "You are a senior chief-of-staff assistant.",
            "Goal: Produce a clear, decision-ready summary using Markdown headings exactly as requested (e.g., '## Summary', '## Action Items').",
            "",
            "Adaptive depth:",
            "- If transcript is short/simple, keep output concise.",
            "- If transcript is long/complex, increase depth and breadth proportionally.",
            "- Always preserve key decisions, owners, dates, and risks.",
            "",
            "Action Items:",
            "- Use 'Owner — Action — Due — Notes' format.",
            "- If missing, propose realistic Owner/Due and mark '(proposed)'.",
            "- Add one measurable 'Metric of success' where applicable.",
            "",
            "Risks:",
            "- Include Probability (L/M/H) and Impact (L/M/H) with one Mitigation.",
            "",
            "Style constraints:",
            "- Use bullets over long paragraphs.",
            "- No filler, no repetition, no speculation (flag assumptions).",
            "- Keep headings clean and standardized.",
            "- Use specific dates when implied and mark '(proposed)'."
        );
    }
}
