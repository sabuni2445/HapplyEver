package com.elegantevents.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ElegantEvents Wedding Management API")
                        .version("1.0.0")
                        .description("RESTful API for managing weddings, services, bookings, guests, and more")
                        .contact(new Contact()
                                .name("ElegantEvents Team")
                                .email("support@elegantevents.com")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server"),
                        new Server().url("https://api.elegantevents.com").description("Production Server")
                ));
    }
}
