// src/controllers/authController.js — Authentication Controller
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { supabase } from '../utils/supabase.js';
import { log } from '../utils/logger.js';

export const signup = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert user into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          full_name: fullName,
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({
        error: 'Signup failed',
        message: error.message,
      });
    }

    log.info('User signed up:', data[0].id);

    // Generate JWT token
    const token = jwt.sign(
      { id: data[0].id, email: data[0].email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: data[0].id,
        email: data[0].email,
        fullName: data[0].full_name,
      },
      token,
    });
  } catch (error) {
    log.error('Signup error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password required',
      });
    }

    // Fetch user from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, data.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: data.id, email: data.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    log.info('User logged in:', data.id);

    res.json({
      message: 'Login successful',
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
      },
      token,
    });
  } catch (error) {
    log.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
};

export const refreshToken = (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Token refreshed',
      token: newToken,
    });
  } catch (error) {
    log.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid token',
    });
  }
};
