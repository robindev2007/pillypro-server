import env from "@/config/env";

/**
 * Base email template with consistent styling
 */
const baseTemplate = (content: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${env.PROJECT_NAME}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .content p {
            color: #666;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
        }
        .button {
            display: inline-block;
            padding: 14px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            opacity: 0.9;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #667eea;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .otp-box {
                font-size: 28px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${env.PROJECT_NAME}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${
    env.PROJECT_NAME
  }. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
            <div class="divider"></div>
            <p style="font-size: 12px; color: #999;">
                If you didn't request this email, please ignore it or contact our support team.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
};

/**
 * Welcome email template
 */
export const welcomeEmailTemplate = (name: string): string => {
  const content = `
    <h2>Welcome to ${env.PROJECT_NAME}! 🎉</h2>
    <p>Hi ${name},</p>
    <p>Thank you for joining ${env.PROJECT_NAME}! We're excited to have you on board.</p>
    
    <div class="info-box">
        <p style="margin: 0;"><strong>What's Next?</strong></p>
        <p style="margin: 5px 0 0 0;">Explore our platform and discover all the amazing features we have to offer.</p>
    </div>
    
    <a href="${env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
    
    <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
    
    <p>Best regards,<br>The ${env.PROJECT_NAME} Team</p>
  `;

  return baseTemplate(content);
};

/**
 * Email verification OTP template
 */
export const verificationOTPTemplate = (name: string, otp: string): string => {
  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${name},</p>
    <p>Thank you for signing up with ${env.PROJECT_NAME}. To complete your registration, please verify your email address using the code below:</p>
    
    <div class="otp-box">
        ${otp}
    </div>
    
    <div class="warning-box">
        <p style="margin: 0;"><strong>⏰ Important:</strong></p>
        <p style="margin: 5px 0 0 0;">This code will expire in 10 minutes. Please verify your email before it expires.</p>
    </div>
    
    <p>If you didn't create an account with ${env.PROJECT_NAME}, please ignore this email.</p>
    
    <p>Best regards,<br>The ${env.PROJECT_NAME} Team</p>
  `;

  return baseTemplate(content);
};

/**
 * Password reset OTP template
 */
export const passwordResetOTPTemplate = (name: string, otp: string): string => {
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Use the verification code below to proceed:</p>
    
    <div class="otp-box">
        ${otp}
    </div>
    
    <div class="warning-box">
        <p style="margin: 0;"><strong>⏰ Important:</strong></p>
        <p style="margin: 5px 0 0 0;">This code will expire in 10 minutes for your security.</p>
    </div>
    
    <div class="info-box">
        <p style="margin: 0;"><strong>🔒 Security Tips:</strong></p>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>Never share this code with anyone</li>
            <li>We will never ask for your password via email</li>
            <li>If you didn't request this, please secure your account immediately</li>
        </ul>
    </div>
    
    <p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
    
    <p>Best regards,<br>The ${env.PROJECT_NAME} Team</p>
  `;

  return baseTemplate(content);
};

/**
 * Password changed confirmation template
 */
export const passwordChangedTemplate = (name: string): string => {
  const content = `
    <h2>Password Changed Successfully ✅</h2>
    <p>Hi ${name},</p>
    <p>This email confirms that your password has been successfully changed.</p>
    
    <div class="info-box">
        <p style="margin: 0;"><strong>Change Details:</strong></p>
        <p style="margin: 5px 0 0 0;">
            <strong>Date:</strong> ${new Date().toLocaleString()}<br>
            <strong>Action:</strong> Password Updated
        </p>
    </div>
    
    <div class="warning-box">
        <p style="margin: 0;"><strong>⚠️ Didn't make this change?</strong></p>
        <p style="margin: 5px 0 0 0;">
            If you didn't change your password, please contact our support team immediately as your account may be compromised.
        </p>
    </div>
    
    <a href="${env.FRONTEND_URL}/support" class="button">Contact Support</a>
    
    <p>For your security, you've been logged out of all devices and will need to log in again with your new password.</p>
    
    <p>Best regards,<br>The ${env.PROJECT_NAME} Team</p>
  `;

  return baseTemplate(content);
};

/**
 * Account verification success template
 */
export const accountVerifiedTemplate = (name: string): string => {
  const content = `
    <h2>Account Verified Successfully! 🎉</h2>
    <p>Hi ${name},</p>
    <p>Congratulations! Your email has been successfully verified and your account is now fully activated.</p>
    
    <div class="info-box">
        <p style="margin: 0;"><strong>✨ You can now:</strong></p>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>Access all features of your account</li>
            <li>Customize your profile</li>
            <li>Start using our services</li>
        </ul>
    </div>
    
    <a href="${env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
    
    <p>Thank you for choosing ${env.PROJECT_NAME}. We're here to help if you need anything!</p>
    
    <p>Best regards,<br>The ${env.PROJECT_NAME} Team</p>
  `;

  return baseTemplate(content);
};

/**
 * Login from new device alert template
 */
export const loginAlertTemplate = (
  name: string,
  device: string,
  location: string,
  time: string
): string => {
  const content = `
    <h2>New Login Detected 🔐</h2>
    <p>Hi ${name},</p>
    <p>We detected a new login to your account. If this was you, you can safely ignore this email.</p>
    
    <div class="info-box">
        <p style="margin: 0;"><strong>Login Details:</strong></p>
        <p style="margin: 5px 0 0 0;">
            <strong>Device:</strong> ${device}<br>
            <strong>Location:</strong> ${location}<br>
            <strong>Time:</strong> ${time}
        </p>
    </div>
    
    <div class="warning-box">
        <p style="margin: 0;"><strong>⚠️ Wasn't you?</strong></p>
        <p style="margin: 5px 0 0 0;">
            If you don't recognize this activity, please secure your account immediately by changing your password.
        </p>
    </div>
    
    <a href="${env.FRONTEND_URL}/security" class="button">Secure My Account</a>
    
    <p>Best regards,<br>The ${env.PROJECT_NAME} Team</p>
  `;

  return baseTemplate(content);
};

/**
 * Password reset success template
 */
export const passwordResetSuccessTemplate = (name: string): string => {
  const content = `
    <h2>Password Reset Successful ✅</h2>
    <p>Hi ${name},</p>
    <p>Your password has been successfully reset. You can now log in with your new password.</p>
    
    <div class="info-box">
        <p style="margin: 0;"><strong>What happened?</strong></p>
        <p style="margin: 5px 0 0 0;">
            For your security, all active sessions have been terminated. You'll need to log in again on all devices.
        </p>
    </div>
    
    <a href="${env.FRONTEND_URL}/login" class="button">Login Now</a>
    
    <div class="warning-box">
        <p style="margin: 0;"><strong>⚠️ Didn't reset your password?</strong></p>
        <p style="margin: 5px 0 0 0;">
            Please contact our support team immediately if you didn't request this password reset.
        </p>
    </div>
    
    <p>Best regards,<br>The ${env.PROJECT_NAME} Team</p>
  `;

  return baseTemplate(content);
};

/**
 * Account deletion confirmation template
 */
export const accountDeletionTemplate = (name: string): string => {
  const content = `
    <h2>Account Deletion Requested</h2>
    <p>Hi ${name},</p>
    <p>We're sorry to see you go. We've received a request to delete your account.</p>
    
    <div class="warning-box">
        <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
        <p style="margin: 5px 0 0 0;">
            Your account will be permanently deleted in 30 days. During this time, you can still log in to cancel the deletion.
        </p>
    </div>
    
    <div class="info-box">
        <p style="margin: 0;"><strong>What will be deleted?</strong></p>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>Your profile information</li>
            <li>All your data and settings</li>
            <li>Access to all services</li>
        </ul>
    </div>
    
    <a href="${env.FRONTEND_URL}/account/cancel-deletion" class="button">Cancel Deletion</a>
    
    <p>If you have any feedback about why you're leaving, we'd love to hear from you.</p>
    
    <p>Best regards,<br>The ${env.PROJECT_NAME} Team</p>
  `;

  return baseTemplate(content);
};

export default {
  welcomeEmailTemplate,
  verificationOTPTemplate,
  passwordResetOTPTemplate,
  passwordChangedTemplate,
  accountVerifiedTemplate,
  loginAlertTemplate,
  passwordResetSuccessTemplate,
  accountDeletionTemplate,
};
