// src/controllers/authController.js — Authentication Controller
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { supabase } from "../utils/supabase.js";
import { log } from "../utils/logger.js";

export const signup = async (req, res) => {
  try {
    const { phone, password, name } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert user into Supabase
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          phone,
          name: name || "User",
          role: "CUSTOMER",
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({
        error: "Signup failed",
        message: error.message,
      });
    }

    log.info("User signed up:", data[0].id);

    // Generate JWT token
    const token = jwt.sign(
      { id: data[0].id, phone: data[0].phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: data[0].id,
        phone: data[0].phone,
        name: data[0].name,
      },
      token,
    });
  } catch (error) {
    log.error("Signup error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: "Phone number required",
      });
    }

    // Fetch user from Supabase
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error || !data) {
      // User doesn't exist, will be created during OTP verification
      return res.status(200).json({
        message: "OTP sent to phone",
        requiresOTP: true,
        phone: phone,
      });
    }

    // User exists, send OTP
    res.json({
      message: "OTP sent to phone",
      requiresOTP: true,
      phone: phone,
      isExistingUser: true,
    });
  } catch (error) {
    log.error("Login error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const refreshToken = (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = jwt.sign(
      { id: decoded.id, phone: decoded.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      message: "Token refreshed",
      token: newToken,
    });
  } catch (error) {
    log.error("Token refresh error:", error);
    res.status(401).json({
      error: "Invalid token",
    });
  }
};
