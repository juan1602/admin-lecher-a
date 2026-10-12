package com.smartlech.adminlecheria.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

/**
 * Acceso con una sola contraseña compartida (APP_PASSWORD).
 * El token es "vencimiento.firma": la firma se hace con la contraseña, así que si se
 * cambia APP_PASSWORD en Render todas las sesiones abiertas dejan de servir.
 */
@Service
public class AuthService {

    private static final long DIAS_SESION = 30;

    @Value("${app.password}")
    private String password;

    public boolean configurada() {
        return password != null && !password.isBlank();
    }

    public boolean passwordCorrecta(String intento) {
        if (!configurada() || intento == null) return false;
        return MessageDigest.isEqual(
            password.getBytes(StandardCharsets.UTF_8),
            intento.getBytes(StandardCharsets.UTF_8));
    }

    public String generarToken() {
        long vence = Instant.now().plus(DIAS_SESION, ChronoUnit.DAYS).getEpochSecond();
        return vence + "." + firmar(String.valueOf(vence));
    }

    public boolean tokenValido(String token) {
        if (!configurada() || token == null) return false;
        int punto = token.indexOf('.');
        if (punto <= 0) return false;
        String vence = token.substring(0, punto);
        String firma = token.substring(punto + 1);
        try {
            if (Long.parseLong(vence) < Instant.now().getEpochSecond()) return false;
        } catch (NumberFormatException e) {
            return false;
        }
        return MessageDigest.isEqual(
            firmar(vence).getBytes(StandardCharsets.UTF_8),
            firma.getBytes(StandardCharsets.UTF_8));
    }

    private String firmar(String datos) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(("admin-lecheria:" + password).getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(mac.doFinal(datos.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("No se pudo firmar el token", e);
        }
    }
}
