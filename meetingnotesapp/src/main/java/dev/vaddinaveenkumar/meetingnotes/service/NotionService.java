package dev.vaddinaveenkumar.meetingnotes.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotionService {

    private final RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${notion.client-id}")
    private String clientId;

    @org.springframework.beans.factory.annotation.Value("${notion.client-secret}")
    private String clientSecret;

    @org.springframework.beans.factory.annotation.Value("${notion.redirect-uri}")
    private String redirectUri;

    public NotionService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String exchangeCode(String code) {
        String url = "https://api.notion.com/v1/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(clientId, clientSecret);

        Map<String, String> body = new HashMap<>();
        body.put("grant_type", "authorization_code");
        body.put("code", code);
        body.put("redirect_uri", redirectUri);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
            throw new RuntimeException("Failed to exchange Notion code.");
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            throw new RuntimeException("Notion OAuth Error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Notion OAuth Error: " + e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> fetchPages(String token) {
        String url = "https://api.notion.com/v1/search";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Notion-Version", "2022-06-28");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("filter", Map.of("value", "page", "property", "object"));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
                List<Map<String, Object>> pages = new ArrayList<>();
                for (Map<String, Object> result : results) {
                    String id = (String) result.get("id");
                    String title = "Untitled";
                    
                    // Try to extract title from properties (varies by database/page structure)
                    try {
                        Map<String, Object> properties = (Map<String, Object>) result.get("properties");
                        if (properties != null) {
                            for (Object propObj : properties.values()) {
                                Map<String, Object> prop = (Map<String, Object>) propObj;
                                if ("title".equals(prop.get("type"))) {
                                    List<Map<String, Object>> titleArr = (List<Map<String, Object>>) prop.get("title");
                                    if (titleArr != null && !titleArr.isEmpty()) {
                                        title = (String) titleArr.get(0).get("plain_text");
                                    }
                                    break;
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                    
                    pages.add(Map.of("id", id, "title", title));
                }
                return pages;
            }
            throw new RuntimeException("Failed to fetch Notion pages.");
        } catch (Exception e) {
            throw new RuntimeException("Notion API Error: " + e.getMessage(), e);
        }
    }

    public void appendToPage(String pageId, String token, String markdownContent) {
        String url = "https://api.notion.com/v1/blocks/" + pageId + "/children";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Notion-Version", "2022-06-28");
        headers.setContentType(MediaType.APPLICATION_JSON);

        List<Map<String, Object>> children = new ArrayList<>();
        String[] lines = markdownContent.split("\n");

        for (String line : lines) {
            String text = line.trim();
            if (text.isEmpty()) continue;

            // Notion limits text content to 2000 chars per block
            if (text.length() > 2000) {
                text = text.substring(0, 2000);
            }

            Map<String, Object> block = new HashMap<>();
            block.put("object", "block");

            if (text.startsWith("### ")) {
                block.put("type", "heading_3");
                block.put("heading_3", Map.of("rich_text", List.of(Map.of("type", "text", "text", Map.of("content", text.substring(4))))));
            } else if (text.startsWith("## ")) {
                block.put("type", "heading_2");
                block.put("heading_2", Map.of("rich_text", List.of(Map.of("type", "text", "text", Map.of("content", text.substring(3))))));
            } else if (text.startsWith("# ")) {
                block.put("type", "heading_1");
                block.put("heading_1", Map.of("rich_text", List.of(Map.of("type", "text", "text", Map.of("content", text.substring(2))))));
            } else if (text.startsWith("- ") || text.startsWith("* ")) {
                block.put("type", "bulleted_list_item");
                block.put("bulleted_list_item", Map.of("rich_text", List.of(Map.of("type", "text", "text", Map.of("content", text.substring(2))))));
            } else {
                block.put("type", "paragraph");
                block.put("paragraph", Map.of("rich_text", List.of(Map.of("type", "text", "text", Map.of("content", text)))));
            }

            children.add(block);
        }

        Map<String, Object> body = Map.of("children", children);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Notion API Error: " + response.getBody());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to export to Notion: " + e.getMessage(), e);
        }
    }
}
