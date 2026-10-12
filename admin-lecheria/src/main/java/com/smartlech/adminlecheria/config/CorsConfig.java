package com.smartlech.adminlecheria.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    // Solo el frontend (Vercel y localhost) puede llamar a la API desde el navegador
    @Value("${app.cors-origins}")
    private String corsOrigins;

    // Va antes que AuthFilter para que las respuestas 401 también lleven los encabezados CORS
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        Arrays.stream(corsOrigins.split(","))
            .map(String::trim)
            .filter(o -> !o.isEmpty())
            .forEach(config::addAllowedOrigin);
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> registro = new FilterRegistrationBean<>(new CorsFilter(source));
        registro.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registro;
    }
}
