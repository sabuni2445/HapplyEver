package com.elegantevents.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Simple WebConfig, CORS is handled by SimpleCorsFilter
}
