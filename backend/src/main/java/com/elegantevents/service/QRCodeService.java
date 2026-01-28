package com.elegantevents.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class QRCodeService {
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    private static final int WIDTH = 300;
    private static final int HEIGHT = 300;
    
    public String generateQRCode(String uniqueCode, String coupleClerkId) {
        try {
            // Create the URL that attendees will use to access their dashboard
            // Use relative URL if frontendUrl is localhost (for development)
            // In production, this should be your actual domain
            String baseUrl = frontendUrl;
            if (baseUrl.contains("localhost") || baseUrl.contains("127.0.0.1")) {
                // For localhost, use relative URL so it works regardless of port
                baseUrl = "";
            }
            String url = baseUrl + "/attendee/dashboard?code=" + uniqueCode + "&couple=" + coupleClerkId;
            
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, WIDTH, HEIGHT);
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            
            byte[] qrCodeBytes = outputStream.toByteArray();
            String base64QRCode = Base64.getEncoder().encodeToString(qrCodeBytes);
            
            return "data:image/png;base64," + base64QRCode;
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
    
    /**
     * Generate QR code and return only the base64 string (without data URI prefix)
     * Useful for embedding in emails
     */
    public String generateQRCodeBase64(String uniqueCode, String coupleClerkId) {
        try {
            String baseUrl = frontendUrl;
            if (baseUrl.contains("localhost") || baseUrl.contains("127.0.0.1")) {
                baseUrl = "";
            }
            String url = baseUrl + "/attendee/dashboard?code=" + uniqueCode + "&couple=" + coupleClerkId;
            
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, WIDTH, HEIGHT);
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            
            byte[] qrCodeBytes = outputStream.toByteArray();
            return Base64.getEncoder().encodeToString(qrCodeBytes);
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
}

