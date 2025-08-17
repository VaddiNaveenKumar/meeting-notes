package com.app.meetingnotes.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.sendgrid.helpers.mail.objects.Personalization;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class EmailService {

    private final SendGrid sendGrid;

    @Value("${app.mail.from}")
    private String fromEmail;

    public EmailService(@Value("${spring.sendgrid.api-key}") String apiKey) {
        this.sendGrid = new SendGrid(apiKey);
    }

    public void sendHtmlEmail(List<String> toList, String subject, String html) {
        Mail mail = new Mail();
        mail.setFrom(new Email(fromEmail));
        mail.setSubject(subject);

        Personalization personalization = new Personalization();
        for (String to : toList) {
            if (to != null && !to.isBlank()) {
                personalization.addTo(new Email(to.trim()));
            }
        }
        mail.addPersonalization(personalization);

        Content content = new Content("text/html", html);
        mail.addContent(content);

        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sendGrid.api(request);
            int status = response.getStatusCode();
            if (status < 200 || status >= 300) {
                throw new RuntimeException("SendGrid error: " + status + " " + response.getBody());
            }
        } catch (IOException e) {
            throw new RuntimeException("SendGrid IO error: " + e.getMessage(), e);
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

    // NEW: enhances standard headings visually in the email (badges, dividers, spacing)
    public String enhanceStandardHeadings(String bodyHtml) {
        if (bodyHtml == null || bodyHtml.isBlank()) return "";

        String html = bodyHtml;

        // Generic H2 styling
        html = html.replaceAll("(?i)<h2>(.*?)</h2>",
                "<div style=\"margin:18px 0 8px 0; font-size:16px; font-weight:800; color:#0f172a;\">$1</div>"
              + "<div style=\"height:1px;background:#eef2f7;margin:8px 0 12px 0;\"></div>");

        // Badge replacements for canonical sections (case-insensitive matches for '## title' variants)
        html = html.replaceAll("(?i)##\\s*summary",
                "<span style=\"display:inline-block;background:#eef2ff;color:#1e40af;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;margin:8px 0;\">Summary</span>");
        html = html.replaceAll("(?i)##\\s*action\\s*items",
                "<span style=\"display:inline-block;background:#ecfdf5;color:#065f46;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;margin:8px 0;\">Action Items</span>");
        html = html.replaceAll("(?i)##\\s*decisions",
                "<span style=\"display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;margin:8px 0;\">Decisions</span>");
        html = html.replaceAll("(?i)##\\s*risks(?:/|\\s)*blockers?",
                "<span style=\"display:inline-block;background:#fee2e2;color:#7f1d1d;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;margin:8px 0;\">Risks / Blockers</span>");
        html = html.replaceAll("(?i)##\\s*next\\s*steps",
                "<span style=\"display:inline-block;background:#f3e8ff;color:#6b21a8;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;margin:8px 0;\">Next Steps</span>");

        // Normalize <li> spacing
        html = html.replaceAll("(?i)<li([^>]*)>", "<li$1 style=\"margin:6px 0;\">");

        // If the body still contains raw '## Heading' lines (e.g., in <pre> conversions), style them
        html = html.replaceAll("(?m)^##\\s*(.+)$",
                "<div style=\"margin:18px 0 8px 0; font-size:16px; font-weight:800; color:#0f172a;\">$1</div>"
              + "<div style=\"height:1px;background:#eef2f7;margin:8px 0 12px 0;\"></div>");

        return html;
    }

    // Optional: lightly style structured “Owner — Action — Due — Notes” lines (monospace)
    public String styleActionRowsLightly(String bodyHtml) {
        if (bodyHtml == null || bodyHtml.isBlank()) return "";
        return bodyHtml.replaceAll(
            "(?m)^\\*\\s*(.+?)\\s—\\s(.+?)\\s—\\s(.+?)(\\s—\\s(.+))?$",
            "<div style=\"font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:14px; line-height:1.7;\">"
          + "<span style=\"color:#0f172a; font-weight:700;\">$1</span> — "
          + "<span>$2</span> — "
          + "<span style=\"color:#065f46;\">$3</span>"
          + "$4"
          + "</div>"
        );
    }

    /* Utility */
    public String escape(String input) {
        if (input == null) return "";
        return input.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
    }
}
