package pe.edu.cibertec.mesaservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@RequiredArgsConstructor
public class FiltroClaveInterna extends OncePerRequestFilter {

    private final String claveInterna;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String enviada = request.getHeader("X-Internal-Key");
        if (enviada != null && MessageDigest.isEqual(
                enviada.getBytes(StandardCharsets.UTF_8),
                claveInterna.getBytes(StandardCharsets.UTF_8))) {
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken("servicio-interno", null,
                            List.of(new SimpleGrantedAuthority("ROLE_SERVICIO"))));
        }
        filterChain.doFilter(request, response);
    }
}
