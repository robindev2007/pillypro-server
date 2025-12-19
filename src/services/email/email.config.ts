import env from "@/config/env";
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";

// Create reusable transporter
let transporter: Transporter;

/**
 * Initialize email transporter with Gmail
 */
const createTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_SECURE, // true for 465, false for other ports
    auth: {
      user: env.MAIL_USER, // Your Gmail address
      pass: env.MAIL_PASS, // Your Gmail App Password (not regular password!)
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Verify connection configuration
  transporter.verify((error) => {
    if (error) {
      console.error("❌ Email transporter verification failed:", error);
    } else {
      console.log("✅ Email service is ready to send messages");
    }
  });

  return transporter;
};

/**
 * Send email with HTML template
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    const transport = createTransporter();

    await transport.sendMail({
      from: `"${env.PROJECT_NAME}" <${env.MAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw new Error("Failed to send email");
  }
};

/**
 * Send email with plain text fallback
 */
export const sendEmailWithText = async (
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> => {
  try {
    const transport = createTransporter();

    await transport.sendMail({
      from: `"${env.PROJECT_NAME}" <${env.MAIL_USER}>`,
      to,
      subject,
      html,
      text, // Plain text fallback
    });

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw new Error("Failed to send email");
  }
};

/**
 * Test email connection
 */
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transport = createTransporter();
    await transport.verify();
    console.log("✅ Email connection test successful");
    return true;
  } catch (error) {
    console.error("❌ Email connection test failed:", error);
    return false;
  }
};

export default {
  sendEmail,
  sendEmailWithText,
  testEmailConnection,
};
