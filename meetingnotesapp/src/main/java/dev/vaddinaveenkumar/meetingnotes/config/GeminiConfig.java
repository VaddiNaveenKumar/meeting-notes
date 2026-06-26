package dev.vaddinaveenkumar.meetingnotes.config;

import dev.vaddinaveenkumar.meetingnotes.service.GeminiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.ArrayList;

@Configuration
public class GeminiConfig {

    @Value("${app.gemini.primary-key}")
    private String key1;

    @Value("${app.gemini.fallback-key}")
    private String key2;

    @Value("${app.gemini.key3:}")
    private String key3;

    @Value("${app.gemini.key4:}")
    private String key4;

    @Value("${app.gemini.key5:}")
    private String key5;

    @Bean
    public GeminiService geminiService(RestTemplate restTemplate, WebClient.Builder webClientBuilder) {
        List<String> keys = new ArrayList<>();
        keys.add(key1);
        keys.add(key2);
        keys.add(key3);
        keys.add(key4);
        keys.add(key5);
        return new GeminiService(keys, "gemini-2.5-flash", restTemplate, webClientBuilder);
    }
}
