package com.elegantevents.service;

import com.elegantevents.model.Payment;
import com.elegantevents.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    
    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }
    
    @Transactional
    public Payment createPayment(Long weddingId, String coupleClerkId, BigDecimal amount, 
                                  Integer paymentNumber, Integer totalPayments, String description) {
        Payment payment = new Payment();
        payment.setWeddingId(weddingId);
        payment.setCoupleClerkId(coupleClerkId);
        payment.setAmount(amount);
        payment.setPaymentNumber(paymentNumber);
        payment.setTotalPayments(totalPayments);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setDescription(description);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }
    
    @Transactional
    public List<Payment> createPaymentSchedule(Long weddingId, String coupleClerkId, 
                                                 List<PaymentScheduleItem> scheduleItems) {
        // Delete existing payments for this wedding
        List<Payment> existingPayments = paymentRepository.findByWeddingId(weddingId);
        paymentRepository.deleteAll(existingPayments);
        
        // Create new payment schedule
        List<Payment> payments = new java.util.ArrayList<>();
        for (PaymentScheduleItem item : scheduleItems) {
            Payment payment = createPayment(
                weddingId,
                coupleClerkId,
                BigDecimal.valueOf(item.getAmount()),
                item.getPaymentNumber(),
                scheduleItems.size(),
                item.getDescription()
            );
            if (item.getDueDate() != null) {
                payment.setDueDate(item.getDueDate());
            }
            payments.add(payment);
        }
        
        return paymentRepository.saveAll(payments);
    }
    
    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByWedding(Long weddingId) {
        return paymentRepository.findByWeddingId(weddingId);
    }
    
    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByCouple(String coupleClerkId) {
        return paymentRepository.findByCoupleClerkId(coupleClerkId);
    }
    
    @Transactional
    public Payment updatePaymentStatus(String chapaReference, String chapaTransactionId, 
                                        Payment.PaymentStatus status) {
        Optional<Payment> paymentOpt = paymentRepository.findByChapaReference(chapaReference);
        if (paymentOpt.isEmpty() && chapaTransactionId != null) {
            paymentOpt = paymentRepository.findByChapaTransactionId(chapaTransactionId);
        }
        
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            payment.setStatus(status);
            payment.setChapaTransactionId(chapaTransactionId);
            if (status == Payment.PaymentStatus.PAID) {
                payment.setPaidDate(LocalDateTime.now());
            }
            payment.setUpdatedAt(LocalDateTime.now());
            return paymentRepository.save(payment);
        }
        
        throw new RuntimeException("Payment not found");
    }
    
    @Transactional
    public Payment updatePayment(Long paymentId, BigDecimal amount, LocalDateTime dueDate, 
                                  String description) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        payment.setAmount(amount);
        payment.setDueDate(dueDate);
        payment.setDescription(description);
        payment.setUpdatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }
    
    @Transactional(readOnly = true)
    public Payment getPaymentById(Long paymentId) {
        return paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
    }
    
    @Transactional
    public Payment savePayment(Payment payment) {
        payment.setUpdatedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }
    
    public static class PaymentScheduleItem {
        private Integer paymentNumber;
        private Double amount;
        private LocalDateTime dueDate;
        private String description;
        
        public Integer getPaymentNumber() { return paymentNumber; }
        public void setPaymentNumber(Integer paymentNumber) { this.paymentNumber = paymentNumber; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public LocalDateTime getDueDate() { return dueDate; }
        public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}

