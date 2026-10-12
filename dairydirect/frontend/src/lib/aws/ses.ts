/**
 * AWS SES Client — Transactional Email Notifications
 * 
 * Env vars required:
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   AWS_SES_FROM_EMAIL (e.g. orders@gjanandsarkar.com)
 * 
 * Note: Verify your domain in SES before sending.
 *       In sandbox mode, only verified emails can receive.
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// ─── Singleton SES Client ─────────────────────────────────────
const globalForSES = globalThis as unknown as { _sesClient: SESClient | undefined };

function createSESClient(): SESClient {
  return new SESClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export const ses = globalForSES._sesClient ?? createSESClient();
if (process.env.NODE_ENV !== 'production') globalForSES._sesClient = ses;

const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || 'orders@gjanandsarkar.com';
const FROM_NAME = 'Gjanand Sarkar';

// ─── Email Templates ─────────────────────────────────────────

/**
 * Send a transactional email
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const toAddresses = Array.isArray(params.to) ? params.to : [params.to];

  try {
    const command = new SendEmailCommand({
      Source: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: { ToAddresses: toAddresses },
      Message: {
        Subject: { Data: params.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: params.htmlBody, Charset: 'UTF-8' },
          ...(params.textBody && { Text: { Data: params.textBody, Charset: 'UTF-8' } }),
        },
      },
    });

    const result = await ses.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    console.error('[SES] Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
}

// ─── Order Email Templates ─────────────────────────────────────

export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  items: { name: string; weight: string; quantity: number; price: number }[];
  total: number;
  deliveryDate: string;
  deliveryAddress: string;
}): Promise<void> {
  const itemsHtml = params.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ede6;">${item.name} (${item.weight})</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ede6;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ede6;text-align:right;">₹${item.price * item.quantity}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#fafaf8;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#2d5a27,#4a8c3f);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">🌿 Gjanand Sarkar</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Fresh. Pure. Delivered.</p>
          </div>
          
          <!-- Content -->
          <div style="padding:32px;">
            <div style="background:#eaf4e2;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
              <p style="color:#3f6530;font-size:20px;font-weight:800;margin:0;">✅ Order Confirmed!</p>
              <p style="color:#5a7a52;font-size:13px;margin:4px 0 0;">Order ID: <strong>${params.orderId}</strong></p>
            </div>
            
            <p style="color:#2d3a26;font-size:16px;">Dear <strong>${params.customerName}</strong>,</p>
            <p style="color:#5a6a52;font-size:14px;line-height:1.6;">Your order has been confirmed and is being prepared with freshness and care. Here's a summary:</p>
            
            <!-- Order Items -->
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <thead>
                <tr style="background:#f5f3ef;">
                  <th style="padding:10px;text-align:left;font-size:12px;color:#7a8870;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
                  <th style="padding:10px;text-align:center;font-size:12px;color:#7a8870;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                  <th style="padding:10px;text-align:right;font-size:12px;color:#7a8870;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px 0;font-weight:800;font-size:15px;color:#2d3a26;">Total</td>
                  <td style="padding:12px 0;font-weight:800;font-size:15px;color:#2d5a27;text-align:right;">₹${params.total}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Delivery Info -->
            <div style="background:#f5f3ef;border-radius:12px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 8px;font-weight:700;color:#2d3a26;">📦 Delivery Details</p>
              <p style="margin:0;color:#5a6a52;font-size:14px;">Expected: <strong>${params.deliveryDate}</strong></p>
              <p style="margin:4px 0 0;color:#5a6a52;font-size:14px;">Address: ${params.deliveryAddress}</p>
            </div>
            
            <p style="color:#7a8870;font-size:13px;text-align:center;margin:24px 0 0;">
              Thank you for choosing Gjanand Sarkar! 🙏<br>
              For support: support@gjanandsarkar.com
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: params.to,
    subject: `Order Confirmed ✅ — ${params.orderId} | Gjanand Sarkar`,
    htmlBody: html,
    textBody: `Order Confirmed! Order ID: ${params.orderId}. Total: ₹${params.total}. Expected delivery: ${params.deliveryDate}.`,
  });
}

export async function sendOrderStatusEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  status: string;
  message?: string;
}): Promise<void> {
  const statusEmoji: Record<string, string> = {
    confirmed: '✅',
    out_for_delivery: '🚚',
    delivered: '🎉',
    cancelled: '❌',
  };
  const emoji = statusEmoji[params.status] || '📦';
  const statusLabel = params.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:20px;background:#fafaf8;font-family:Arial,sans-serif;">
      <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <h1 style="color:#2d5a27;text-align:center;">🌿 Gjanand Sarkar</h1>
        <div style="text-align:center;padding:20px 0;">
          <p style="font-size:40px;margin:0;">${emoji}</p>
          <h2 style="color:#2d3a26;margin:8px 0;">Order ${statusLabel}</h2>
          <p style="color:#7a8870;font-size:14px;">Order ID: ${params.orderId}</p>
        </div>
        <p style="color:#2d3a26;">Hi <strong>${params.customerName}</strong>,</p>
        <p style="color:#5a6a52;">${params.message || `Your order status has been updated to: ${statusLabel}.`}</p>
        <p style="color:#7a8870;font-size:13px;text-align:center;margin-top:24px;">
          Questions? Email us at support@gjanandsarkar.com
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: params.to,
    subject: `${emoji} Order ${statusLabel} — ${params.orderId}`,
    htmlBody: html,
  });
}

export async function sendAdminNewOrderAlert(params: {
  orderId: string;
  customerName: string;
  total: number;
  itemCount: number;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || 'gjanandsarkar09@gmail.com';

  const html = `
    <div style="font-family:Arial,sans-serif;padding:20px;max-width:400px;background:#fff;border-radius:12px;">
      <h2 style="color:#2d5a27;">🛒 New Order Received</h2>
      <p><strong>Order:</strong> ${params.orderId}</p>
      <p><strong>Customer:</strong> ${params.customerName}</p>
      <p><strong>Items:</strong> ${params.itemCount}</p>
      <p><strong>Total:</strong> ₹${params.total}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders" 
         style="display:inline-block;background:#2d5a27;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px;">
        View in Admin Panel
      </a>
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `🛒 New Order: ${params.orderId} — ₹${params.total}`,
    htmlBody: html,
  });
}
