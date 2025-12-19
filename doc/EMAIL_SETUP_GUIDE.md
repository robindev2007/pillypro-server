# 🚀 Quick Email Setup Guide

## ⚡ 5-Minute Setup

### Step 1: Get Gmail App Password (2 minutes)

1. Go to: https://myaccount.google.com/
2. Click **Security** → Enable **2-Step Verification** (if not enabled)
3. Search for "**App passwords**" in the search bar
4. Click **App passwords**
5. Select: **Mail** + **Windows Computer**
6. Click **Generate**
7. **Copy the 16-digit password** (Example: `abcd efgh ijkl mnop`)

### Step 2: Update .env File (1 minute)

Open your `.env` file and update these lines:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=abcdefghijklmnop
```

**Replace:**

- `your-email@gmail.com` → Your Gmail address
- `abcdefghijklmnop` → Your App Password (remove spaces!)

### Step 3: Restart Server (1 minute)

```bash
bun dev
```

**Look for this in console:**

```
✅ Email service is ready to send messages
```

### Step 4: Test It! (1 minute)

Sign up a new user and check your email inbox! 📧

---

## ✅ What's Already Done

✅ **Nodemailer installed**
✅ **8 email templates created**
✅ **Gmail SMTP configured**
✅ **Integrated with auth system**
✅ **Auto-sends on:**

- User signup → Verification OTP
- Email verification → Welcome confirmation
- Password reset → Reset OTP
- Password changed → Security alert
- And more!

---

## 🎨 Email Templates Included

1. **Verification OTP** - With countdown timer
2. **Password Reset OTP** - Security focused
3. **Account Verified** - Celebration email
4. **Password Changed** - Security alert
5. **Password Reset Success** - Confirmation
6. **Welcome Email** - Onboarding
7. **Login Alert** - New device detection
8. **Account Deletion** - Goodbye email

All templates are:

- 📱 Mobile responsive
- 🎨 Beautifully designed
- 🔒 Security focused
- 🌐 Production ready

---

## 🚨 Common Issues

### "Email not sending"

- ❌ Using regular Gmail password → ✅ Use App Password
- ❌ App Password has spaces → ✅ Remove all spaces
- ❌ 2-Step Verification off → ✅ Enable it first

### "Invalid login error"

```env
# Wrong ❌
MAIL_PASS=abcd efgh ijkl mnop

# Correct ✅
MAIL_PASS=abcdefghijklmnop
```

### "Still not working?"

Run this test:

```typescript
import { testEmailConnection } from "@/services/email/email.config";
await testEmailConnection();
```

---

## 📚 Full Documentation

See `EMAIL_SERVICE_DOCS.md` for:

- Complete API reference
- Custom template creation
- Troubleshooting guide
- Production recommendations
- Security best practices

---

## 🎯 Already Integrated

All emails are automatically sent in `auth.service.ts`:

```typescript
// ✅ Signup → sends verification OTP
await sendVerificationOTP(email, name, otp);

// ✅ Email verified → sends confirmation
await sendAccountVerifiedEmail(email, name);

// ✅ Password reset → sends OTP
await sendPasswordResetOTP(email, name, otp);

// ✅ Password changed → sends alert
await sendPasswordChangedEmail(email, name);
```

**No additional code needed!** Just configure Gmail and it works! 🎉

---

## 💡 Pro Tips

1. **Test with your own email first**
2. **Check spam folder** if you don't see emails
3. **Gmail limits: 500 emails/day** (upgrade for more)
4. **For production:** Consider SendGrid/AWS SES

---

## ✨ That's It!

Your authentication system now sends professional emails automatically. Just add your Gmail App Password and you're done! 🚀

**Total Setup Time:** ~5 minutes
**Code Changes Required:** 0 (already integrated!)
**Emails Working:** 8 types, all ready to go!

---

**Questions?** Check `EMAIL_SERVICE_DOCS.md` for detailed help.
