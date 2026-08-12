import { z } from 'zod';

const phoneValidation = z
  .string()
  .trim()
  .regex(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit mobile number.');

const nameNoNumbers = z
  .string()
  .trim()
  .regex(/^[a-zA-Z\s\u0900-\u097F\-']+$/, 'Name cannot contain numbers.')
  .refine((val) => !/\d/.test(val), { message: 'Name cannot contain numbers.' });

export const sendOtpSchema = z.object({
  body: z.object({
    phone: phoneValidation,
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: phoneValidation,
    otp: z.string().min(4, 'OTP must be at least 4 digits'),
  }),
});

export const syncOAuthSchema = z.object({
  body: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    first_name: nameNoNumbers.optional(),
    last_name: nameNoNumbers.optional(),
    name: nameNoNumbers.optional(),
    avatar_url: z.string().optional(),
    phone: phoneValidation.optional(),
    token: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    first_name: nameNoNumbers.optional(),
    last_name: nameNoNumbers.optional(),
    name: nameNoNumbers.optional(),
    email: z.string().email().optional(),
    phone: phoneValidation.optional(),
    avatar_url: z.string().optional(),
    default_upi_id: z.string().optional(),
  }),
});
