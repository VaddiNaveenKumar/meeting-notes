package dev.vaddinaveenkumar.meetingnotes.service;

import com.google.gson.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;

import java.util.*;

public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private final List<String> apiKeys;
    private final String defaultModel;
    private final RestTemplate restTemplate;
    private final WebClient webClient;

    public GeminiService(List<String> apiKeys, String defaultModel,
                         RestTemplate restTemplate, WebClient.Builder webClientBuilder) {
        this.apiKeys = apiKeys.stream()
                .filter(k -> k != null && !k.isBlank())
                .toList();
        this.defaultModel = defaultModel;
        this.restTemplate = restTemplate;
        this.webClient = webClientBuilder.build();
    }

    public String generateSummary(String transcript, String userInstruction) {
        if (apiKeys.isEmpty()) throw new RuntimeException("No Gemini API keys configured.");
        String promptText = "Instruction:\n" + userInstruction + "\n\nTranscript:\n" + transcript;
        Exception lastEx = null;

        for (int keyIdx = 0; keyIdx < apiKeys.size(); keyIdx++) {
            String key = apiKeys.get(keyIdx);
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", defaultModel, key);
            Map<String, Object> body = buildBody(promptText, getSystemPromptTemplate(), 0.25);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            for (int attempt = 0; attempt <= 1; attempt++) {
                try {
                    ResponseEntity<String> res = restTemplate.postForEntity(url, entity, String.class);
                    return parseGenerateResponse(res.getBody());
                } catch (HttpStatusCodeException httpEx) {
                    int status = httpEx.getStatusCode().value();
                    log.warn("Gemini key[{}] attempt={} status={}", keyIdx, attempt, status);
                    lastEx = httpEx;
                    if (status == 429) break;
                    if (status >= 500 && attempt == 0) { sleep(500); continue; }
                    break;
                } catch (Exception ex) {
                    log.warn("Gemini key[{}] attempt={} error: {}", keyIdx, attempt, ex.getMessage());
                    lastEx = ex;
                    if (attempt == 0) sleep(500);
                }
            }
        }
        throw new RuntimeException("All Gemini keys exhausted. Last error: " + (lastEx != null ? lastEx.getMessage() : "unknown"), lastEx);
    }

    public Flux<String> streamSummary(String transcript, String userInstruction) {
        String promptText = "Instruction:\n" + userInstruction + "\n\nTranscript:\n" + transcript;
        return buildStreamWithFallback(promptText, getSystemPromptTemplate(), 0.25);
    }

    public Flux<String> streamChat(String transcript, String summary, String userMessage) {
        String systemPrompt = "You are an AI assistant helping a user understand their meeting transcript. " +
                "Answer the user question accurately using only the provided Transcript Context and AI Summary Context. " +
                "Keep your answer concise and format it in Markdown.";
        String promptText = "User Question: " + userMessage +
                "\n\nTranscript Context:\n" + transcript +
                "\n\nAI Summary Context:\n" + summary;
        return buildStreamWithFallback(promptText, systemPrompt, 0.3);
    }

    private Flux<String> buildStreamWithFallback(String promptText, String systemPrompt, double temperature) {
        if (apiKeys.isEmpty()) return Flux.error(new RuntimeException("No Gemini API keys configured."));
        Flux<String> chain = buildStream(apiKeys.get(0), promptText, systemPrompt, temperature);
        for (int i = 1; i < apiKeys.size(); i++) {
            final int ki = i;
            chain = chain.onErrorResume(this::is429, e -> {
                log.warn("Gemini key[{}] 429, trying key[{}]...", ki - 1, ki);
                return buildStream(apiKeys.get(ki), promptText, systemPrompt, temperature);
            });
        }
        return chain;
    }

    private Flux<String> buildStream(String key, String promptText, String systemPrompt, double temperature) {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse&key=%s", defaultModel, key);
        Map<String, Object> body = buildBody(promptText, systemPrompt, temperature);
        return webClient.post()
                .uri(java.net.URI.create(url))
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(new org.springframework.core.ParameterizedTypeReference<org.springframework.http.codec.ServerSentEvent<String>>() {})
                .map(event -> {
                    String json = event.data();
                    if (json == null || json.isEmpty()) return "";
                    try {
                        JsonObject root = JsonParser.parseString(json).getAsJsonObject();
                        JsonArray candidates = root.getAsJsonArray("candidates");
                        if (candidates == null || candidates.isEmpty()) return "";
                        JsonObject first = candidates.get(0).getAsJsonObject();
                        JsonObject content = first.getAsJsonObject("content");
                        if (content == null) return "";
                        JsonArray parts = content.getAsJsonArray("parts");
                        if (parts == null || parts.isEmpty()) return "";
                        return parts.get(0).getAsJsonObject().get("text").getAsString();
                    } catch (Exception e) {
                        log.warn("Error parsing Gemini stream chunk: {}", e.getMessage());
                        return "";
                    }
                })
                .filter(text -> !text.isEmpty());
    }

    private boolean is429(Throwable e) {
        if (e instanceof WebClientResponseException.TooManyRequests) return true;
        if (e instanceof WebClientResponseException wce && wce.getStatusCode().value() == 429) return true;
        return e.getMessage() != null && e.getMessage().contains("429");
    }

    private Map<String, Object> buildBody(String promptText, String systemPrompt, double temperature) {
        Map<String, Object> body = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> userContent = new HashMap<>();
        userContent.put("parts", List.of(Map.of("text", promptText)));
        contents.add(userContent);
        body.put("contents", contents);
        Map<String, Object> sysInstr = new HashMap<>();
        sysInstr.put("parts", List.of(Map.of("text", systemPrompt)));
        body.put("systemInstruction", sysInstr);
        body.put("generationConfig", Map.of("temperature", temperature));
        return body;
    }

    private String parseGenerateResponse(String responseBody) {
        if (responseBody == null) throw new RuntimeException("Gemini returned null body.");
        JsonObject root = JsonParser.parseString(responseBody).getAsJsonObject();
        JsonArray candidates = root.getAsJsonArray("candidates");
        if (candidates == null || candidates.isEmpty()) throw new RuntimeException("No candidates returned by Gemini.");
        JsonObject first = candidates.get(0).getAsJsonObject();
        JsonObject content = first.getAsJsonObject("content");
        JsonArray parts = content.getAsJsonArray("parts");
        if (parts == null || parts.isEmpty()) throw new RuntimeException("No parts in Gemini response.");
        return parts.get(0).getAsJsonObject().get("text").getAsString();
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }

    private String getSystemPromptTemplate() {
        return String.join("\n",
            "You are a senior chief-of-staff assistant.",
            "Goal: Produce a clear, decision-ready summary using Markdown headings exactly as requested.",
            "",
            "Adaptive depth:",
            "- If transcript is short/simple, keep output concise.",
            "- If transcript is long/complex, increase depth and breadth proportionally.",
            "- Always preserve key decisions, owners, dates, and risks.",
            "",
            "Action Items:",
            "- Use 'Owner - Action - Due - Notes' format.",
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
