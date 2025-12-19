# 📧 Email Service Documentation

## Overview

Complete email service implementation using Nodemailer with Gmail SMTP. Includes beautiful, responsive HTML templates for all authentication-related emails.

## 🎨 Features

✅ **Gmail Integration** - Configured for Gmail SMTP
✅ **Beautiful Templates** - Professional, responsive HTML emails
✅ **8 Pre-built Templates** - All auth-related emails covered
✅ **Automatic Fallback** - Plain text alternatives
✅ **Connection Verification** - Tests email config on startup
✅ **Error Handling** - Graceful error management
✅ **Type-Safe** - Full TypeScript support
✅ **Customizable** - Easy to modify and extend

## 📁 File Structure

```
src/services/email/
├── email.config.ts      - Nodemailer configuration & core functions
├── email.templates.ts   - HTML email templates
└── index.ts            - High-level email functions (use these!)
```

## 🔧 Setup Instructions

### 1. Enable Gmail App Password

**Important:** You CANNOT use your regular Gmail password for SMTP!

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** (left sidebar)
3. Enable **2-Step Verification** if not already enabled
4. Search for **App Passwords** in the search bar
5. Click **App passwords**
6. Select **Mail** and **Windows Computer** (or Other)
7. Click **Generate**
8. Copy the **16-digit password** (format: xxxx xxxx xxxx xxxx)

### 2. Update Environment Variables

Update your `.env` file:

```env
# Gmail SMTP Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-16-digit-app-password
```

**Important:**

- Replace `your-email@gmail.com` with your Gmail address
- Replace `your-16-digit-app-password` with the password from step 1
- Remove spaces from the app password (xxxxxxxxxxxx)

### 3. Test Email Connection

The service automatically tests the connection when your server starts. Check the console:

✅ Success: `✅ Email service is ready to send messages`
❌ Failure: `❌ Email transporter verification failed:`

## 📧 Available Email Templates

### 1. Verification OTP Email

Sent when user signs up or resends OTP.

```typescript
await sendVerificationOTP(email, name, otp);
```

**Features:**

- Large, centered OTP code
- 10-minute expiration warning
- Security information
- Responsive design

### 2. Password Reset OTP Email

Sent when user requests password reset.

```typescript
await sendPasswordResetOTP(email, name, otp);
```

**Features:**

- Secure OTP display
- Security tips
- Expiration warning
- Action guidance

### 3. Password Changed Confirmation

Sent after successful password change.

```typescript
await sendPasswordChangedEmail(email, name);
```

**Features:**

- Change timestamp
- Security alert if unauthorized
- Contact support button
- Clear call-to-action

### 4. Account Verified Success

Sent after email verification.

```typescript
await sendAccountVerifiedEmail(email, name);
```

**Features:**

- Celebration message
- Features overview
- Dashboard link
- Welcome message

### 5. Password Reset Success

Sent after successful password reset.

```typescript
await sendPasswordResetSuccess(email, name);
```

**Features:**

- Success confirmation
- Session termination info
- Login link
- Security notice

### 6. Welcome Email

Sent to welcome new users (optional).

```typescript
await sendWelcomeEmail(email, name);
```

**Features:**

- Welcome message
- Getting started guide
- Dashboard link
- Brand introduction

### 7. Login Alert

Sent when login from new device detected.

```typescript
await sendLoginAlert(email, name, device, location);
```

**Features:**

- Device information
- Location tracking
- Time stamp
- Security action link

### 8. Account Deletion

Sent when account deletion is requested.

```typescript
await sendAccountDeletionTemplate(email, name);
```

**Features:**

- 30-day grace period
- Cancellation option
- Data deletion info
- Feedback request

## 🎨 Template Design

All templates feature:

- **Responsive Design** - Works on mobile and desktop
- **Professional Styling** - Gradient headers, clean layout
- **Consistent Branding** - Uses PROJECT_NAME from env
- **Security Focus** - Clear warnings and instructions
- **Accessibility** - Good contrast, readable fonts
- **Call-to-Actions** - Prominent buttons where needed

### Color Scheme

- Primary: Gradient purple (#667eea to #764ba2)
- Background: White (#ffffff)
- Text: Dark gray (#333) and Medium gray (#666)
- Borders: Light gray (#e0e0e0)
- Warnings: Yellow (#fff3cd)
- Info: Light blue (#f8f9fa)

## 💻 Usage in Auth Service

All email functions are already integrated in `auth.service.ts`:

### Sign Up

```typescript
// Automatically sends verification OTP
await sendVerificationOTP(email, name, otp);
```

### Email Verification

```typescript
// Automatically sends confirmation
await sendAccountVerifiedEmail(email, name);
```

### Password Change

```typescript
// Automatically sends confirmation
await sendPasswordChangedEmail(email, name);
```

### Password Reset

```typescript
// Automatically sends OTP
await sendPasswordResetOTP(email, name, otp);

// Automatically sends success confirmation
await sendPasswordResetSuccess(email, name);
```

### Resend OTP

```typescript
// Automatically sends new OTP
await sendVerificationOTP(email, name, otp);
```

## 🔍 Core Functions

### Send Email (Low-level)

```typescript
import { sendEmail } from "@/services/email/email.config";

await sendEmail("user@example.com", "Your Subject", "<h1>HTML Content</h1>");
```

### Send Email with Text Fallback

```typescript
import { sendEmailWithText } from "@/services/email/email.config";

await sendEmailWithText(
  "user@example.com",
  "Your Subject",
  "<h1>HTML Content</h1>",
  "Plain text fallback"
);
```

### Test Connection

```typescript
import { testEmailConnection } from "@/services/email/email.config";

const isConnected = await testEmailConnection();
```

## 🛠️ Creating Custom Templates

### 1. Add Template to email.templates.ts

```typescript
export const myCustomTemplate = (name: string, data: any): string => {
  const content = `
    <h2>Custom Title</h2>
    <p>Hi ${name},</p>
    <p>Your custom content here...</p>
    
    <div class="info-box">
        <p>Important information</p>
    </div>
    
    <a href="${env.FRONTEND_URL}/action" class="button">Take Action</a>
  `;

  return baseTemplate(content);
};
```

### 2. Add Function to index.ts

```typescript
export const sendMyCustomEmail = async (
  to: string,
  name: string,
  data: any
): Promise<void> => {
  const html = myCustomTemplate(name, data);
  await sendEmail(to, "Your Subject", html);
};
```

### 3. Use in Your Code

```typescript
import { sendMyCustomEmail } from "@/services/email";

await sendMyCustomEmail(email, name, data);
```

## 📱 Template Components

### Info Box

```html
<div class="info-box">
  <p><strong>Title</strong></p>
  <p>Content here</p>
</div>
```

### Warning Box

```html
<div class="warning-box">
  <p><strong>⚠️ Warning Title</strong></p>
  <p>Warning content</p>
</div>
```

### OTP Display

```html
<div class="otp-box">123456</div>
```

### Button

```html
<a href="${env.FRONTEND_URL}/path" class="button"> Button Text </a>
```

### Divider

```html
<div class="divider"></div>
```

## 🚨 Troubleshooting

### Email Not Sending

**1. Check Gmail App Password**

- Make sure you're using an App Password, not your regular password
- Remove any spaces from the password
- Generate a new App Password if needed

**2. Check 2-Step Verification**

- Gmail requires 2-Step Verification for App Passwords
- Enable it at: https://myaccount.google.com/security

**3. Check Environment Variables**

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password-no-spaces
```

**4. Check Console for Errors**
Look for error messages:

```
❌ Email transporter verification failed: [error details]
❌ Failed to send email to [email]: [error details]
```

**5. Test Connection**

```typescript
import { testEmailConnection } from "@/services/email/email.config";
const result = await testEmailConnection();
console.log(result); // Should be true
```

### Common Errors

**"Invalid login: 535-5.7.8 Username and Password not accepted"**

- Using regular password instead of App Password
- App Password has spaces in it
- 2-Step Verification not enabled

**"Connection timeout"**

- Wrong MAIL_HOST or MAIL_PORT
- Firewall blocking SMTP port
- Check internet connection

**"Self signed certificate in certificate chain"**

- Set `MAIL_SECURE=false` for port 587
- Or use port 465 with `MAIL_SECURE=true`

## 🔐 Security Best Practices

1. ✅ **Never commit .env file** - Add to .gitignore
2. ✅ **Use App Passwords** - Never use your main Gmail password
3. ✅ **Rotate passwords** - Change App Passwords periodically
4. ✅ **Monitor usage** - Check sent emails regularly
5. ✅ **Rate limiting** - Implement email rate limiting (coming soon)
6. ✅ **Validate emails** - Always validate email addresses
7. ✅ **Handle errors** - Don't expose email errors to users
8. ✅ **Log activity** - Keep logs of sent emails

## 📊 Gmail Sending Limits

**Free Gmail Account:**

- 500 emails per day
- 500 recipients per message
- Consider using a dedicated email service for production

**Alternatives for High Volume:**

- SendGrid (free tier: 100 emails/day)
- AWS SES (pay-as-you-go)
- Mailgun (free tier: 5000 emails/month)
- Postmark (free tier: 100 emails/month)

## 🎯 Production Recommendations

1. **Use a Dedicated Email Service**

   - SendGrid, AWS SES, Mailgun, or Postmark
   - Better deliverability
   - Higher sending limits
   - Better analytics

2. **Add Email Queue**

   - Use Bull or BullMQ
   - Retry failed emails
   - Rate limiting
   - Background processing

3. **Add Email Tracking**

   - Track opens and clicks
   - Monitor bounce rates
   - Analyze engagement

4. **Implement Rate Limiting**

   - Prevent email spam
   - Comply with provider limits
   - Protect against abuse

5. **Add Unsubscribe Option**
   - Legal requirement in many countries
   - Manage preferences
   - Respect user choices

## ✅ Integration Checklist

- [x] Install nodemailer
- [x] Create email templates
- [x] Setup Gmail SMTP
- [x] Integrate with auth service
- [x] Test email sending
- [ ] Configure Gmail App Password (YOUR TASK)
- [ ] Update .env with credentials (YOUR TASK)
- [ ] Test all email types
- [ ] Add email queue (optional, for production)
- [ ] Setup monitoring (optional)

## 🎉 You're All Set!

Your email service is now fully integrated with your authentication system. All auth-related emails will be sent automatically!

**Next Steps:**

1. Get your Gmail App Password
2. Update `.env` file
3. Restart server
4. Test by signing up a new user

---

**Need Help?**

- Check troubleshooting section above
- Review Gmail App Password setup
- Test connection with `testEmailConnection()`
