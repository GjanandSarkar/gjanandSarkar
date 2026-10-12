/**
 * AWS SNS Client — OTP SMS Delivery & Notifications
 * 
 * Env vars required:
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   AWS_SNS_SENDER_ID (optional, e.g. 'DAIRYDIR')
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// ─── Singleton SNS Client ─────────────────────────────────────
const globalForSNS = globalThis as unknown as { _snsClient: SNSClient | undefined };

function createSNSClient(): SNSClient {
  return new SNSClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export const sns = globalForSNS._snsClient ?? createSNSClient();
if (process.env.NODE_ENV !== 'production') globalForSNS._snsClient = sns;

// ─── Send OTP via SMS ─────────────────────────────────────────

/**
 * Send a 6-digit OTP via SMS using AWS SNS.
 * Phone number must include country code: +91XXXXXXXXXX
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Normalize phone number to E.164 format
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  const message = `Your Gjanand Sarkar verification code is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;

  try {
    const command = new PublishCommand({
      PhoneNumber: normalizedPhone,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: process.env.AWS_SNS_SENDER_ID || 'GJANSRKAR',
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional', // Higher delivery priority
        },
      },
    });

    const result = await sns.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    console.error('[SNS] Failed to send OTP SMS:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a general SMS notification
 */
export async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const command = new PublishCommand({
      PhoneNumber: normalizedPhone,
      Message: message.slice(0, 160), // SMS max length
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    });
    await sns.send(command);
    return { success: true };
  } catch (error: any) {
    console.error('[SNS] Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Normalize phone number to E.164 format for India (+91XXXXXXXXXX)
 */
function normalizePhoneNumber(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits

  // Already has country code
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // 10-digit Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  // Has + prefix
  if (phone.startsWith('+') && cleaned.length >= 10) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Generate a secure 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
