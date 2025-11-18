const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, studentId, password, phoneNumber, department, level } = req.body;

        // Validate input
        if (!fullName || !email || !studentId || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('email, student_id')
            .or(`email.eq.${email},student_id.eq.${studentId}`);

        if (checkError) {
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }

        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'User with this email or student ID already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const { data: user, error: insertError } = await supabase
            .from('users')
            .insert([{
                full_name: fullName,
                email,
                student_id: studentId,
                password: hashedPassword,
                phone_number: phoneNumber,
                department,
                level,
                balance: 0.00,
                total_rides: 0,
                total_spent: 0.00,
                is_active: true
            }])
            .select();

        if (insertError) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create user' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user[0].id, email: user[0].email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user[0].id,
                full_name: user[0].full_name,
                email: user[0].email,
                student_id: user[0].student_id,
                balance: user[0].balance
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password are required' 
            });
        }

        // Find user
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (fetchError || !user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                student_id: user.student_id,
                balance: user.balance,
                total_rides: user.total_rides,
                total_spent: user.total_spent
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

module.exports = router;
