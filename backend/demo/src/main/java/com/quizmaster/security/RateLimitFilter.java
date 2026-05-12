package com.quizmaster.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.util.HttpRequestUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Hard cap on the rate at which a single client can hit the auth endpoints.
 *
 *  POST /api/v1/auth/login
 *  POST /api/v1/auth/refresh
 *  POST /api/v1/auth/password-reset/request
 *  POST /api/v1/auth/password-reset/confirm
 *  POST /api/v1/auth/me/password
 *
 * Returns 429 Too Many Requests with a Retry-After header when the quota
 * is exhausted. Keeps brute-force credential stuffing slow without
 * impacting normal users.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final List<String> THROTTLED_PATHS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/password-reset/request",
            "/api/v1/auth/password-reset/confirm",
            "/api/v1/auth/me/password");

    private final AuthRateLimiter limiter;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only POSTs to the throttled list need rate limiting.
        if (!"POST".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI();
        return THROTTLED_PATHS.stream().noneMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String ip = HttpRequestUtils.clientIp(request);
        if (!limiter.allow(ip)) {
            long retryAfter = limiter.retryAfterSeconds(ip);
            log.info("Rate limit exceeded for {} on {} — retry in {}s",
                    ip, request.getRequestURI(), retryAfter);

            response.setStatus(429); // HTTP 429 Too Many Requests
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            objectMapper.writeValue(response.getOutputStream(),
                    ApiResponse.error("Too many attempts. Try again in "
                            + retryAfter + " second" + (retryAfter == 1 ? "" : "s") + "."));
            return;
        }
        chain.doFilter(request, response);
    }
}
