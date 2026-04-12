// src/controllers/otpController.js — OTP Authentication Controller
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabase.js";
import { log } from "../utils/logger.js";
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPViaSMS,
  invalidateOTPs,
} from "../utils/otp.js";

/**
 * Step 1: Request OTP
 * POST /api/auth/request-otp
 * Body: { phone }
 */
export const requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: "Phone number is required",
      });
    }

    // Validate phone format (basic validation)
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      return res.status(400).json({
        error: "Invalid phone number format",
      });
    }

    try {
      // Invalidate previous OTPs
      await invalidateOTPs(phone);

      // Generate new OTP
      const otp = generateOTP();

      // Store OTP in database
      await storeOTP(phone, otp);

      // Send OTP via SMS (demo mode: logs to console)
      await sendOTPViaSMS(phone, otp);

      log.info("OTP requested for phone:", phone);

      res.json({
        message: "OTP sent successfully",
        phone: phone,
        expiresIn: "5 minutes",
        isDemoMode: true, // Indicate demo mode
      });
    } catch (error) {
      log.error("OTP request error:", error);
      return res.status(500).json({
        error: "Failed to send OTP",
        message: error.message,
      });
    }
  } catch (error) {
    log.error("Request OTP error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

/**
 * Step 2: Verify OTP and Complete Authentication
 * POST /api/auth/verify-otp
 * Body: { phone, otp, name? }
 */
export const verifyOTPAndLogin = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        error: "Phone and OTP are required",
      });
    }

    try {
      // Verify OTP
      const otpResult = await verifyOTP(phone, otp);

      if (!otpResult.success) {
        return res.status(401).json({
          error: otpResult.message,
        });
      }

      // Check if user exists
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

      // If user doesn't exist, create new user
      if (userError || !userData) {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              phone,
              name: name || "Customer",
              role: "CUSTOMER",
            },
          ])
          .select();

        if (createError) {
          return res.status(400).json({
            error: "Failed to create user",
            message: createError.message,
          });
        }

        userData = newUser[0];
        log.info("New user created:", userData.id);
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: userData.id, phone: userData.phone },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      );

      log.info("User authenticated via OTP:", userData.id);

      res.json({
        message: "Authentication successful",
        user: {
          id: userData.id,
          phone: userData.phone,
          name: userData.name,
          role: userData.role,
        },
        token,
      });
    } catch (error) {
      log.error("OTP verification error:", error);
      return res.status(500).json({
        error: "OTP verification failed",
        message: error.message,
      });
    }
  } catch (error) {
    log.error("Verify OTP error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

/**
 * Resend OTP (same phone, new code)
 * POST /api/auth/resend-otp
 * Body: { phone }
 */
export const resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: "Phone number is required",
      });
    }

    try {
      // Invalidate previous OTPs
      await invalidateOTPs(phone);

      // Generate new OTP
      const otp = generateOTP();

      // Store OTP in database
      await storeOTP(phone, otp);

      // Send OTP via SMS
      await sendOTPViaSMS(phone, otp);

      log.info("OTP resent for phone:", phone);

      res.json({
        message: "OTP resent successfully",
        phone: phone,
        expiresIn: "5 minutes",
      });
    } catch (error) {
      log.error("OTP resend error:", error);
      return res.status(500).json({
        error: "Failed to resend OTP",
        message: error.message,
      });
    }
  } catch (error) {
    log.error("Resend OTP error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};
