// src/validators/auth.validator.js — Auth Module Zod Schemas
import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number'),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});
