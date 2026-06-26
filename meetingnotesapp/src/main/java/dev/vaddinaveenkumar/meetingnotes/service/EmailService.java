package dev.vaddinaveenkumar.meetingnotes.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EmailService {

    private final RestTemplate restTemplate;

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${app.mail.from}")
    private String fromEmail;

    public EmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void sendHtmlEmail(List<String> toList, String subject, String html) {
        String url = "https://api.resend.com/emails";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        List<String> cleanToList = toList.stream()
                .filter(to -> to != null && !to.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());

        Map<String, Object> body = new HashMap<>();
        body.put("from", fromEmail);
        body.put("to", cleanToList);
        body.put("subject", subject);
        body.put("html", html);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Resend error: " + response.getStatusCode() + " " + response.getBody());
            }
        } catch (Exception e) {
            throw new RuntimeException("Resend HTTP error: " + e.getMessage(), e);
        }
    }

    // PREMIUM, SECTIONED TEMPLATE
    // Renders a modern header and a content card. Pair it with enhanceStandardHeadings() for best results.
    public String buildBrandedTemplate(String title, String bodyHtml) {
        String safeTitle = escape(title);
        String safeBody = bodyHtml == null ? "" : bodyHtml;

        return "<!doctype html>\n"
            + "<html>\n"
            + "<head>\n"
            + "  <meta charset=\"UTF-8\" />\n"
            + "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>\n"
            + "  <title>" + safeTitle + "</title>\n"
            + "</head>\n"
            + "<body style=\"margin:0;padding:0;background:#f5f7fb;font-family:Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif;color:#0f172a;\">\n"
            + "  <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background:#f5f7fb;padding:28px 0;\">\n"
            + "    <tr>\n"
            + "      <td align=\"center\">\n"
            + "        <table role=\"presentation\" width=\"760\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:760px; max-width:94%;\">\n"

            // Header
            + "          <tr><td style=\"padding:0 0 14px 0;\">\n"
            + "            <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-radius:14px; overflow:hidden; background:linear-gradient(135deg,#0b1220,#1f2937);\">\n"
            + "              <tr>\n"
            + "                <td style=\"padding:18px 22px; color:#e5e7eb; font-weight:800; letter-spacing:0.3px; font-size:16px;\">AI Meeting Notes Summarizer</td>\n"
            + "                <td align=\"right\" style=\"padding:18px 22px; color:#9ca3af; font-size:12px;\">\n"
            + "                  <span style=\"background:#374151;color:#e5e7eb;padding:6px 10px;border-radius:999px;\">Auto‑generated</span>\n"
            + "                </td>\n"
            + "              </tr>\n"
            + "            </table>\n"
            + "          </td></tr>\n"

            // Title
            + "          <tr><td style=\"padding:6px 4px 12px 4px;\">\n"
            + "            <h1 style=\"margin:0;font-size:22px;line-height:1.35;color:#0f172a;font-weight:800;\">" + safeTitle + "</h1>\n"
            + "          </td></tr>\n"

            // Card
            + "          <tr><td>\n"
            + "            <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background:#ffffff;border-radius:14px;box-shadow:0 10px 30px rgba(15,23,42,0.08);\">\n"
            + "              <tr>\n"
            + "                <td style=\"padding:22px;\">\n"
            + "                  <div style=\"font-size:15px; line-height:1.75; color:#0f172a;\">\n"
            +                      safeBody + "\n"
            + "                  </div>\n"
            + "                </td>\n"
            + "              </tr>\n"
            + "            </table>\n"
            + "          </td></tr>\n"

            // Footer chip
            + "          <tr><td style=\"padding:12px 6px 0 6px; text-align:center;\">\n"
            + "            <div style=\"display:inline-block; padding:8px 12px; font-size:12px; color:#6b7280; background:#ffffff; border:1px solid #e5e7eb; border-radius:999px;\">Sent via AI Meeting Notes Summarizer</div>\n"
            + "          </td></tr>\n"

            + "        </table>\n"
            + "      </td>\n"
            + "    </tr>\n"
            + "  </table>\n"
            + "</body>\n"
            + "</html>";
    }

    // Optional: converts plain/markdown-ish text to neat HTML (headings, bullets, paragraphs)
    public String wrapPlainTextBeautifully(String text) {
        if (text == null) text = "";
        String esc = escape(text);

        String html = esc;

        // Headings
        html = html.replaceAll("(?m)^###\\s*(.+)$",
                "<h3 style=\"margin:16px 0 8px 0;font-size:16px;color:#0f172a;font-weight:800;\">$1</h3>");
        html = html.replaceAll("(?m)^##\\s*(.+)$",
                "<h2 style=\"margin:18px 0 8px 0;font-size:18px;color:#0f172a;font-weight:800;\">$1</h2>");
        html = html.replaceAll("(?m)^#\\s*(.+)$",
                "<h1 style=\"margin:18px 0 8px 0;font-size:20px;color:#0f172a;font-weight:800;\">$1</h1>");

        // Bullets
        html = html.replaceAll("(?m)^\\*\\s(.+)$", "<li style=\"margin:6px 0;\">$1</li>");
        html = html.replaceAll("(?s)(<li[^>]*>.*?</li>)",
                "<ul style=\"margin:8px 0 12px 20px;padding:0;\">$1</ul>");

        // Paragraphs and line breaks
        html = html.replaceAll("\\n\\n+", "</p><p style=\\\"margin:0 0 10px 0;\\\">");
        html = "<p style=\"margin:0 0 10px 0;\">"+ html.replaceAll("\\n", "<br/>") +"</p>";

        return html;
    }

    // NEW: Inject premium inline CSS directly into standard HTML tags for perfect email client rendering
    public String applyInlineStyles(String html) {
        if (html == null || html.isBlank()) return "";

        // Headings
        html = html.replaceAll("(?i)<h1([^>]*)>", "<h1$1 style=\"margin: 24px 0 16px; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.025em;\">");
        html = html.replaceAll("(?i)<h2([^>]*)>", "<h2$1 style=\"margin: 24px 0 12px; font-size: 20px; font-weight: 700; color: #1f2937; letter-spacing: -0.025em; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;\">");
        html = html.replaceAll("(?i)<h3([^>]*)>", "<h3$1 style=\"margin: 16px 0 8px; font-size: 16px; font-weight: 600; color: #374151;\">");
        
        // Paragraphs
        html = html.replaceAll("(?i)<p([^>]*)>", "<p$1 style=\"margin: 0 0 16px; line-height: 1.6; color: #4b5563; font-size: 15px;\">");
        
        // Lists
        html = html.replaceAll("(?i)<ul([^>]*)>", "<ul$1 style=\"margin: 0 0 16px; padding-left: 24px; color: #4b5563; font-size: 15px; line-height: 1.6;\">");
        html = html.replaceAll("(?i)<ol([^>]*)>", "<ol$1 style=\"margin: 0 0 16px; padding-left: 24px; color: #4b5563; font-size: 15px; line-height: 1.6;\">");
        html = html.replaceAll("(?i)<li([^>]*)>", "<li$1 style=\"margin-bottom: 8px;\">");
        
        // Blockquotes
        html = html.replaceAll("(?i)<blockquote([^>]*)>", "<blockquote$1 style=\"margin: 16px 0; padding: 12px 16px; border-left: 4px solid #6366f1; background-color: #eef2ff; color: #4f46e5; font-style: italic; border-radius: 0 8px 8px 0;\">");
        
        // Code blocks & inline code
        html = html.replaceAll("(?i)<pre([^>]*)>", "<pre$1 style=\"margin: 16px 0; padding: 16px; background-color: #1f2937; color: #f3f4f6; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px;\">");
        
        // Need to be careful with <code> inside <pre> vs inline <code>. 
        // A simple approach for inline <code> that also affects <pre><code> (which is fine since we styled <pre>):
        html = html.replaceAll("(?i)<code([^>]*)>", "<code$1 style=\"font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.9em; padding: 2px 4px; background-color: #f3f4f6; color: #ef4444; border-radius: 4px;\">");

        // Strong
        html = html.replaceAll("(?i)<strong([^>]*)>", "<strong$1 style=\"font-weight: 600; color: #111827;\">");
        
        return html;
    }

    /* Utility */
    public String escape(String input) {
        if (input == null) return "";
        return input.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
    }
}
