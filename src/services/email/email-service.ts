import nodemailer from "nodemailer";
import { welcomeEmailTemplate } from "./email.templates";

// emailService.ts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"MyApp" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email send failed:", err);
    throw err;
  }
};

// High-level helper functions
export const sendWelcomeEmail = async (to: string, name: string) => {
  const html = welcomeEmailTemplate(name);
  await sendEmail(to, "Welcome to MyApp!", html);
};

export const sendOTPEmail = async (to: string, otp: string) => {
  const html = "hellok";
  await sendEmail(to, "Your OTP Code", html);
};

export default { sendEmail, sendWelcomeEmail, sendOTPEmail };
