package com.quizmaster.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lightweight in-memory sliding-window rate limiter for the auth endpoints
 * (login, refresh, password-reset). Each (key) — typically the client IP — is
 * allowed at most {@code maxAttempts} requests in a rolling {@code windowSeconds}
 * window; further requests are rejected by {@link RateLimitFilter}.
 *
 * Notes:
 *  - In-memory only. For a multi-instance deployment you'd swap this for a
 *    Redis-backed token bucket. For single-instance (which is where we are
 *    today) this is the right complexity.
 *  - The map grows with unique IPs; an entry is implicitly garbage collected
 *    when its window empties out via cleanup-on-access.
 */
@Component
public class AuthRateLimiter {

    private final int maxAttempts;
    private final long windowMs;

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public AuthRateLimiter(
            @Value("${app.ratelimit.auth.max-attempts:10}") int maxAttempts,
            @Value("${app.ratelimit.auth.window-seconds:60}") int windowSeconds) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowSeconds * 1000L;
    }

    /**
     * Returns true if the request is allowed, false if the key has exceeded
     * its quota. Increments the counter on each allowed call.
     */
    public boolean allow(String key) {
        if (key == null || key.isBlank()) key = "unknown";
        long now = Instant.now().toEpochMilli();
        long cutoff = now - windowMs;

        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            // Drop timestamps that have fallen out of the window
            while (!q.isEmpty() && q.peekFirst() < cutoff) {
                q.pollFirst();
            }
            if (q.size() >= maxAttempts) return false;
            q.addLast(now);
            return true;
        }
    }

    /** How many seconds the caller should wait before the next allowed request. */
    public long retryAfterSeconds(String key) {
        Deque<Long> q = hits.get(key);
        if (q == null || q.isEmpty()) return 1;
        long oldest;
        synchronized (q) {
            oldest = q.peekFirst() == null ? Instant.now().toEpochMilli() : q.peekFirst();
        }
        long wait = (oldest + windowMs) - Instant.now().toEpochMilli();
        return Math.max(1, wait / 1000);
    }
}
