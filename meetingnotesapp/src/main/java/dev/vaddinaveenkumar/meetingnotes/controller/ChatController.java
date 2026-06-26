package dev.vaddinaveenkumar.meetingnotes.controller;

import dev.vaddinaveenkumar.meetingnotes.service.GeminiService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final GeminiService geminiService;

    public ChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody Map<String, String> request) {
        String transcript = request.getOrDefault("transcript", "");
        String summary = request.getOrDefault("summary", "");
        String message = request.getOrDefault("message", "");

        SseEmitter emitter = new SseEmitter(10 * 60 * 1000L); // 10 minutes timeout

        Flux<String> stream = geminiService.streamChat(transcript, summary, message);

        stream.subscribe(
                chunk -> {
                    try {
                        // Replace newlines with double-backslash n so it doesn't break SSE framing
                        String safeChunk = chunk.replace("\n", "\\n");
                        emitter.send(safeChunk);
                    } catch (Exception e) {
                        emitter.completeWithError(e);
                    }
                },
                error -> {
                    System.err.println("Chat stream error: " + error.getMessage());
                    emitter.completeWithError(error);
                },
                emitter::complete
        );

        return emitter;
    }
}
