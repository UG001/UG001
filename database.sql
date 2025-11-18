-- UNN Shuttle Booking System Database Schema
-- This file creates the complete database structure with sample data

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    department VARCHAR(100),
    level VARCHAR(20),
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_rides INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration VARCHAR(50),
    available_seats INT DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shuttles table
CREATE TABLE shuttles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    shuttle_type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    route_id INT NOT NULL,
    shuttle_id INT,
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    seats INT DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    departure_time DATETIME,
    arrival_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (shuttle_id) REFERENCES shuttles(id) ON DELETE SET NULL
);

-- Transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT,
    type ENUM('funding', 'payment', 'refund') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    reference_id VARCHAR(100),
    description TEXT,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- Insert sample routes
INSERT INTO routes (name, description, origin, destination, price, duration, available_seats) VALUES
('Campus Gate to Science Department', 'Main campus route to science faculty', 'Campus Gate', 'Science Department', 150.00, '15 mins', 20),
('Science Department to Library', 'Faculty route to main library', 'Science Department', 'Main Library', 100.00, '10 mins', 20),
('Library to Student Hostels', 'Evening route to hostels', 'Main Library', 'Student Hostels', 200.00, '20 mins', 20),
('Campus Gate to Nsukka Town', 'Town route for shopping and errands', 'Campus Gate', 'Nsukka Town', 300.00, '30 mins', 25),
('Student Hostels to Campus Gate', 'Morning route to campus', 'Student Hostels', 'Campus Gate', 150.00, '15 mins', 20);

-- Insert sample shuttles
INSERT INTO shuttles (plate_number, shuttle_type, capacity, driver_name, driver_phone) VALUES
('UNN-001-AB', '18-Seater Bus', 18, 'John Okonkwo', '08012345678'),
('UNN-002-CD', '14-Seater Bus', 14, 'Muhammad Ibrahim', '08023456789'),
('UNN-003-EF', 'Mini Bus', 12, 'Grace Okeke', '08034567890');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_route_id ON bookings(route_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_routes_active ON routes(is_active);
