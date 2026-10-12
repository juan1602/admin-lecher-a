package com.smartlech.adminlecheria.config;

import com.smartlech.adminlecheria.exception.QuincenaCerradaException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ManejadorErrores {

    // 423 (Locked): el frontend lo muestra con alert() desde el interceptor de axios
    @ExceptionHandler(QuincenaCerradaException.class)
    public ResponseEntity<String> quincenaCerrada(QuincenaCerradaException e) {
        return ResponseEntity.status(HttpStatus.LOCKED).body(e.getMessage());
    }
}
