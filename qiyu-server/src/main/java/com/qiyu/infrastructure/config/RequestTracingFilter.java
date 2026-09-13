package com.qiyu.infrastructure.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Correlates every request with a trace id propagated to logs and back to the client.
 *
 * <p>The trace id is read from the inbound {@code X-Request-Id} header when present (allowing
 * a gateway or client to correlate), otherwise a UUID is generated. It is placed in the MDC
 * for the {@code %X{traceId}} log pattern and echoed on the response so a failed request can
 * be traced back to its server-side entries.</p>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestTracingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestTracingFilter.class);
    private static final String TRACE_HEADER = "X-Request-Id";
    private static final String TRACE_KEY = "traceId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String traceId = request.getHeader(TRACE_HEADER);
        if (traceId == null || traceId.isBlank() || traceId.length() > 64) {
            traceId = UUID.randomUUID().toString().replace("-", "");
        }
        MDC.put(TRACE_KEY, traceId);
        response.setHeader(TRACE_HEADER, traceId);
        long startedAt = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            int status = response.getStatus();
            long elapsed = System.currentTimeMillis() - startedAt;
            // One structured line per request for diagnostics and alerting.
            log.info("method={} path={} status={} durationMs={} traceId={}",
                    request.getMethod(), request.getRequestURI(), status, elapsed, traceId);
            MDC.remove(TRACE_KEY);
        }
    }
}
