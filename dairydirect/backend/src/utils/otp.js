// src/utils/otp.js — OTP Utility Functions
import { supabase } from "./supabase.js";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP in database for verification
 */
export const storeOTP = async (phone, otp) => {
  const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  try {
    const { data, error } = await supabase.from("otp_store").insert([
      {
        phone,
        otp,
        expires_at: expiryTime,
        verified: false,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to store OTP: ${error.message}`);
  }
};

/**
 * Verify OTP for a given phone number
 */
export const verifyOTP = async (phone, otp) => {
  try {
    const { data, error } = await supabase
      .from("otp_store")
      .select("*")
      .eq("phone", phone)
      .eq("otp", otp)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: "Invalid or expired OTP",
      };
    }

    // Mark OTP as verified
    await supabase
      .from("otp_store")
      .update({ verified: true })
      .eq("id", data.id);

    return {
      success: true,
      message: "OTP verified successfully",
    };
  } catch (error) {
    throw new Error(`OTP verification failed: ${error.message}`);
  }
};

/**
 * Invalidate all previous OTPs for a phone number
 */
export const invalidateOTPs = async (phone) => {
  try {
    await supabase
      .from("otp_store")
      .update({ verified: true })
      .eq("phone", phone)
      .eq("verified", false);

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to invalidate OTPs: ${error.message}`);
  }
};

/**
 * In production: Send OTP via SMS using Twilio or similar
 * For demo: Log to console or store in database
 */
export const sendOTPViaSMS = async (phone, otp) => {
  try {
    // TODO: Implement actual SMS sending via Twilio/AWS SNS
    console.log(`[OTP] Phone: ${phone}, Code: ${otp}`);

    // For demo purposes, return success
    return { success: true, message: "OTP sent successfully (demo mode)" };
  } catch (error) {
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};
