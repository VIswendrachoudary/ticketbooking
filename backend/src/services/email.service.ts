import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Generate Ethereal test account or fallback logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`📧 Configured Nodemailer with Ethereal test account: ${testAccount.user}`);
    } catch (err) {
      console.warn('⚠️ Could not create Ethereal account, falling back to simulated mailer');
    }
  }
  return transporter;
}

export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

export async function sendTicketEmail(details: {
  toEmail: string;
  userName: string;
  bookingRef: string;
  eventTitle: string;
  venueName: string;
  venueAddress: string;
  startTime: Date;
  seatNumbers: string[];
  totalPrice: number;
}) {
  const qrPayload = JSON.stringify({
    bookingRef: details.bookingRef,
    event: details.eventTitle,
    venue: details.venueName,
    seats: details.seatNumbers,
    time: details.startTime,
    holder: details.userName,
  });

  const qrDataUrl = await generateQRCode(qrPayload);
  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🎉 Ticket Confirmed!</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Ref: <strong>${details.bookingRef}</strong></p>
      </div>

      <div style="padding: 20px; color: #334155;">
        <p style="font-size: 16px;">Hello <strong>${details.userName}</strong>,</p>
        <p>Your booking for <strong>${details.eventTitle}</strong> is confirmed!</p>

        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">Event Details</h3>
          <p style="margin: 4px 0;"><strong>Event:</strong> ${details.eventTitle}</p>
          <p style="margin: 4px 0;"><strong>Venue:</strong> ${details.venueName} (${details.venueAddress})</p>
          <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${new Date(details.startTime).toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Seats:</strong> ${details.seatNumbers.join(', ')}</p>
          <p style="margin: 4px 0;"><strong>Total Paid:</strong> $${details.totalPrice.toFixed(2)}</p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <p style="font-weight: bold; margin-bottom: 10px; color: #1e293b;">Your QR Code Ticket</p>
          <img src="cid:qrcode-ticket" alt="QR Code Ticket" style="width: 200px; height: 200px; border: 2px dashed #6366f1; padding: 10px; border-radius: 12px; background: white;" />
          <p style="font-size: 12px; color: #64748b; margin-top: 5px;">Present this QR code at venue entry</p>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        <p>© 2026 Ticket Booking Platform. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    const trans = await getTransporter();
    if (trans) {
      const info = await trans.sendMail({
        from: env.SMTP_FROM,
        to: details.toEmail,
        subject: `[TICKET CONFIRMED] ${details.eventTitle} - ${details.bookingRef}`,
        html,
        attachments: [
          {
            filename: `ticket-${details.bookingRef}.png`,
            content: base64Data,
            encoding: 'base64',
            cid: 'qrcode-ticket',
          },
        ],
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Email sent to ${details.toEmail}! MessageId: ${info.messageId}`);
      if (previewUrl) {
        console.log(`🔗 Ethereal Email Preview: ${previewUrl}`);
      }
    } else {
      console.log(`📧 [Simulated Email] Sent QR ticket ${details.bookingRef} to ${details.toEmail}`);
    }
  } catch (err: any) {
    console.error('Error sending email:', err.message);
  }
}

export async function sendWaitlistOfferEmail(details: {
  toEmail: string;
  userName: string;
  eventTitle: string;
  category: string;
  seatNumber: string;
  claimUrl: string;
  offerExpiresAt: Date;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #eab308; color: #1e293b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">⚡ A Seat is Available for You!</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Waitlist Seat Offer - Action Required</p>
      </div>

      <div style="padding: 20px; color: #334155;">
        <p style="font-size: 16px;">Hello <strong>${details.userName}</strong>,</p>
        <p>A seat has freed up for <strong>${details.eventTitle}</strong> in the <strong>${details.category}</strong> section!</p>

        <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fef08a;">
          <p style="margin: 4px 0;"><strong>Offered Seat:</strong> ${details.seatNumber}</p>
          <p style="margin: 4px 0;"><strong>Category:</strong> ${details.category}</p>
          <p style="margin: 4px 0; color: #dc2626;"><strong>Offer Expires At:</strong> ${new Date(details.offerExpiresAt).toLocaleString()}</p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${details.claimUrl}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            🎟️ Claim Your Seat Now
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center;">
          If you do not claim this seat within the time limit, it will automatically be offered to the next customer on the waitlist.
        </p>
      </div>
    </div>
  `;

  try {
    const trans = await getTransporter();
    if (trans) {
      const info = await trans.sendMail({
        from: env.SMTP_FROM,
        to: details.toEmail,
        subject: `[ACTION REQUIRED] Seat Available for ${details.eventTitle}`,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Waitlist offer email sent to ${details.toEmail}! MessageId: ${info.messageId}`);
      if (previewUrl) console.log(`🔗 Ethereal Preview: ${previewUrl}`);
    } else {
      console.log(`📧 [Simulated Email] Sent waitlist offer to ${details.toEmail}: ${details.claimUrl}`);
    }
  } catch (err: any) {
    console.error('Error sending waitlist email:', err.message);
  }
}
