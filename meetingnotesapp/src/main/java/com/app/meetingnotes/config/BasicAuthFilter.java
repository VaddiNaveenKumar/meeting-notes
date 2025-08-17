package com.app.meetingnotes.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
@Order(1)
public class BasicAuthFilter implements Filter {

    @Value("${app.auth.enabled:true}")
    private boolean authEnabled;

    @Value("${APP_BASIC_AUTH_USER:admin}")
    private String authUser;

    @Value("${APP_BASIC_AUTH_PASS:changeme}")
    private String authPass;

    private boolean isExcludedPath(String path) {
        // Public endpoints (adjust as needed)
        if (path.startsWith("/api/health")) return true;
        if (path.startsWith("/error")) return true;
        return false;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (!authEnabled) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Allow CORS preflight without auth
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String path = req.getRequestURI();
        if (isExcludedPath(path)) {
            chain.doFilter(request, response);
            return;
        }

        String auth = req.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Basic ")) {
            unauthorized(res);
            return;
        }
        String b64 = auth.substring("Basic ".length()).trim();
        String decoded;
        try {
            decoded = new String(Base64.getDecoder().decode(b64), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            unauthorized(res);
            return;
        }
        int idx = decoded.indexOf(':');
        if (idx < 0) {
            unauthorized(res);
            return;
        }
        String u = decoded.substring(0, idx);
        String p = decoded.substring(idx + 1);
        if (!authUser.equals(u) || !authPass.equals(p)) {
            unauthorized(res);
            return;
        }

        chain.doFilter(request, response);
    }

    private void unauthorized(HttpServletResponse res) throws IOException {
        res.setStatus(401);
        res.setHeader("WWW-Authenticate", "Basic realm=\"MeetingSummarizer\"");
        res.setContentType("application/json");
        res.getWriter().write("{\"error\":\"Unauthorized\"}");
    }
}
