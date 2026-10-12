package com.smartlech.adminlecheria.controller;

import com.smartlech.adminlecheria.config.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) throws InterruptedException {
        if (!authService.configurada()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Falta configurar APP_PASSWORD en el servidor");
        }
        if (!authService.passwordCorrecta(body.get("password"))) {
            // Demora para que no se pueda adivinar la contraseña probando muchas seguidas
            Thread.sleep(1000);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Contraseña incorrecta");
        }
        return ResponseEntity.ok(Map.of("token", authService.generarToken()));
    }
}
