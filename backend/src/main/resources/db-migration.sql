-- Migration script to update image_url column to LONGTEXT type
-- Run this SQL in your MySQL database to fix the "Data too long" error

ALTER TABLE users MODIFY COLUMN image_url LONGTEXT;

-- Add name_font_size column to wedding_cards table (if not exists)
-- Note: If you get an error, the column may already exist. You can ignore it.
ALTER TABLE wedding_cards ADD COLUMN IF NOT EXISTS name_font_size VARCHAR(20) DEFAULT '3rem';

-- Add background_video column for video backgrounds
ALTER TABLE wedding_cards ADD COLUMN IF NOT EXISTS background_video LONGTEXT;

-- Create gallery_items table for shared wedding gallery
CREATE TABLE IF NOT EXISTS gallery_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wedding_id BIGINT NOT NULL,
    uploaded_by_clerk_id VARCHAR(255) NOT NULL,
    file_url LONGTEXT NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    caption TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
);

-- Add priority and seat_number to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'STANDARD';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS seat_number VARCHAR(50);

-- Create attendee_ratings table
CREATE TABLE IF NOT EXISTS attendee_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wedding_id BIGINT NOT NULL,
    guest_id BIGINT NOT NULL,
    rated_type VARCHAR(20) NOT NULL,
    rated_id VARCHAR(255),
    rating INT NOT NULL,
    comment TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

-- Create wedding_messages table
CREATE TABLE IF NOT EXISTS wedding_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wedding_id BIGINT NOT NULL,
    sender_clerk_id VARCHAR(255) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    recipient_type VARCHAR(20),
    recipient_guest_id BIGINT,
    message TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

-- Add password column to users table (optional for DB-based login)
ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL;

-- Create payments table for payment schedules
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wedding_id BIGINT NOT NULL,
    couple_clerk_id VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_number INT NOT NULL,
    total_payments INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date DATETIME,
    paid_date DATETIME,
    chapa_transaction_id VARCHAR(255),
    chapa_reference VARCHAR(100),
    description TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
    INDEX idx_wedding_id (wedding_id),
    INDEX idx_couple_clerk_id (couple_clerk_id),
    INDEX idx_status (status)
);

-- Fix task status and category truncation
ALTER TABLE tasks MODIFY COLUMN status VARCHAR(50) NOT NULL;
ALTER TABLE tasks MODIFY COLUMN category VARCHAR(50) NOT NULL;
