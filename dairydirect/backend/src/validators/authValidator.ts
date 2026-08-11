import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    otp: z.string().min(4, 'OTP must be at least 4 digits'),
  }),
});

export const syncOAuthSchema = z.object({
  body: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    avatar_url: z.string().optional(),
    phone: z.string().optional(),
    token: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    avatar_url: z.string().optional(),
    default_upi_id: z.string().optional(),
  }),
});
