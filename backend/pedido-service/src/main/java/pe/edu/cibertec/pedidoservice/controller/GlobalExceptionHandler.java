package pe.edu.cibertec.pedidoservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.edu.cibertec.pedidoservice.dto.ErrorMessage;
import pe.edu.cibertec.pedidoservice.service.ServicioNoDisponibleException;

import java.time.LocalDate;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorMessage> badRequest(IllegalArgumentException e) {
        return respuesta(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorMessage> notFound(NoSuchElementException e) {
        return respuesta(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorMessage> forbidden(AccessDeniedException e) {
        String msg = "Access Denied".equals(e.getMessage())
                ? "No tienes permiso para realizar esta acción."
                : e.getMessage();
        return respuesta(HttpStatus.FORBIDDEN, msg);
    }

    @ExceptionHandler(ServicioNoDisponibleException.class)
    public ResponseEntity<ErrorMessage> serviceUnavailable(ServicioNoDisponibleException e) {
        return respuesta(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
    }

    private ResponseEntity<ErrorMessage> respuesta(HttpStatus status, String mensaje) {
        return ResponseEntity.status(status).body(ErrorMessage.builder()
                .statusCode(status.value())
                .dateError(LocalDate.now())
                .message(mensaje)
                .build());
    }
}
