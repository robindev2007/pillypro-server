# File Upload Middleware Guide

## Overview

Comprehensive file upload system using Multer with validation, multiple upload types, and easy-to-use API similar to `authorize` middleware.

## Installation

```bash
bun add multer
bun add --dev @types/multer
```

## Basic Usage

### 1. Single File Upload

```typescript
import { uploadSingle, FileTypes } from "@/middleware/upload.middleware";

// Simple upload (optional)
router.post("/profile", uploadSingle("avatar"), controller);

// With validation
router.post(
  "/profile",
  uploadSingle("avatar", {
    allowedTypes: FileTypes.IMAGES,
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true,
  }),
  controller
);
```

### 2. Multiple Files (Same Field)

```typescript
import { uploadMultiple, FileTypes } from "@/middleware/upload.middleware";

// Upload up to 5 images
router.post(
  "/gallery",
  uploadMultiple("images", 5, {
    allowedTypes: FileTypes.IMAGES,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    required: true,
  }),
  controller
);
```

### 3. Multiple Fields (Different Names)

```typescript
import { uploadFields, FileTypes } from "@/middleware/upload.middleware";

// Upload resume + certificates
router.post(
  "/application",
  uploadFields(
    [
      { name: "resume", maxCount: 1, required: true },
      { name: "certificates", maxCount: 3, required: false },
    ],
    {
      allowedTypes: FileTypes.DOCUMENTS,
      maxSize: 5 * 1024 * 1024,
    }
  ),
  controller
);
```

## Available Options

### UploadOptions Interface

```typescript
interface UploadOptions {
  allowedTypes?: string[]; // File types allowed
  maxSize?: number; // Max file size in bytes
  required?: boolean; // Is file required?
}
```

### Predefined File Types

```typescript
import { FileTypes } from "@/middleware/upload.middleware";

FileTypes.IMAGES; // .jpg, .jpeg, .png, .gif, .webp, .svg
FileTypes.DOCUMENTS; // .pdf, .doc, .docx, .txt, .csv, .xlsx
FileTypes.VIDEOS; // .mp4, .avi, .mov, .wmv, .flv
FileTypes.AUDIO; // .mp3, .wav, .ogg, .m4a
FileTypes.ALL; // All file types (use with caution)
```

### Custom File Types

```typescript
router.post(
  "/upload",
  uploadSingle("file", {
    allowedTypes: [".zip", ".rar", ".7z"], // Custom extensions
    // OR use mimetypes
    allowedTypes: ["application/zip", "application/x-rar-compressed"],
  }),
  controller
);
```

## Controller Examples

### Single File Access

```typescript
export const uploadAvatar = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Access file properties
  console.log({
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    originalname: file.originalname,
  });

  res.json({
    success: true,
    message: "File uploaded successfully",
    data: {
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      size: file.size,
    },
  });
};
```

### Multiple Files Access

```typescript
export const uploadGallery = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const uploadedFiles = files.map((file) => ({
    filename: file.filename,
    path: `/uploads/${file.filename}`,
    size: file.size,
  }));

  res.json({
    success: true,
    message: `${files.length} files uploaded successfully`,
    data: { files: uploadedFiles },
  });
};
```

### Multiple Fields Access

```typescript
export const submitApplication = async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const resume = files.resume?.[0];
  const certificates = files.certificates || [];

  res.json({
    success: true,
    message: "Application submitted",
    data: {
      resume: resume ? resume.filename : null,
      certificates: certificates.map((f) => f.filename),
    },
  });
};
```

## Complete Route Examples

### Example 1: Profile Picture Upload

```typescript
import { uploadSingle, FileTypes } from "@/middleware/upload.middleware";
import { authorize } from "@/middleware/auth.middleware";

router.post(
  "/profile/avatar",
  authorize("LOGGED_IN"),
  uploadSingle("avatar", {
    allowedTypes: FileTypes.IMAGES,
    maxSize: 5 * 1024 * 1024, // 5MB
    required: true,
  }),
  async (req, res) => {
    const user = req.user;
    const file = req.file!;

    // Save to database
    await prisma.user.update({
      where: { id: user.userId },
      data: { profile: file.filename },
    });

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: { avatarUrl: `/uploads/${file.filename}` },
    });
  }
);
```

### Example 2: Document Upload (Multiple)

```typescript
router.post(
  "/documents",
  authorize("LOGGED_IN"),
  uploadMultiple("documents", 5, {
    allowedTypes: FileTypes.DOCUMENTS,
    maxSize: 10 * 1024 * 1024,
    required: true,
  }),
  async (req, res) => {
    const files = req.files as Express.Multer.File[];

    // Save to database
    const documents = await prisma.document.createMany({
      data: files.map((file) => ({
        userId: req.user!.userId,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: file.path,
      })),
    });

    res.json({
      success: true,
      message: "Documents uploaded successfully",
      data: { count: files.length },
    });
  }
);
```

### Example 3: Job Application (Multiple Fields)

```typescript
router.post(
  "/apply",
  authorize("LOGGED_IN"),
  uploadFields(
    [
      { name: "resume", maxCount: 1, required: true },
      { name: "coverLetter", maxCount: 1, required: false },
      { name: "certificates", maxCount: 5, required: false },
    ],
    {
      allowedTypes: FileTypes.DOCUMENTS,
    }
  ),
  async (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { jobId } = req.body;

    const application = await prisma.application.create({
      data: {
        userId: req.user!.userId,
        jobId,
        resume: files.resume[0].filename,
        coverLetter: files.coverLetter?.[0]?.filename,
        certificates: files.certificates?.map((f) => f.filename) || [],
      },
    });

    res.json({
      success: true,
      message: "Application submitted",
      data: application,
    });
  }
);
```

## Error Responses

### File Too Large

```json
{
  "success": false,
  "statusCode": 400,
  "message": "File too large. Maximum size is 5MB",
  "data": {
    "maxSize": 5242880,
    "field": "avatar"
  }
}
```

### Invalid File Type

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid file type. Allowed types: .jpg, .jpeg, .png",
  "data": {
    "allowedTypes": [".jpg", ".jpeg", ".png"],
    "receivedType": ".txt"
  }
}
```

### Required File Missing

```json
{
  "success": false,
  "statusCode": 400,
  "message": "File 'avatar' is required",
  "data": {
    "field": "avatar"
  }
}
```

### Too Many Files

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Too many files. Maximum is 5",
  "data": {
    "maxCount": 5,
    "field": "images"
  }
}
```

## File Management

### Delete Uploaded File

```typescript
import { deleteFile, deleteFiles } from "@/middleware/upload.middleware";

// Delete single file
deleteFile("/path/to/file.jpg");

// Delete multiple files
const files = req.files as Express.Multer.File[];
deleteFiles(files);
```

### Delete on Error (Rollback)

```typescript
router.post("/upload", uploadSingle("file"), async (req, res, next) => {
  try {
    const file = req.file!;

    // Your business logic
    await someOperation();

    res.json({ success: true });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
});
```

## Middleware Order

```typescript
// ✅ CORRECT ORDER
router.post(
  "/endpoint",
  rateLimit, // 1. Rate limit
  authorize(), // 2. Authentication
  uploadSingle("file"), // 3. File upload
  validation, // 4. Body validation
  controller // 5. Business logic
);
```

## File Storage Location

Files are stored in: `project-root/uploads/`

Filename format: `originalname-timestamp-random.ext`

Example: `avatar-1701789600000-123456789.jpg`

## Serve Static Files

Add to `app.ts`:

```typescript
import express from "express";
import path from "path";

const app = express();

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
```

Access files: `http://localhost:5000/uploads/filename.jpg`

## Security Best Practices

### 1. Always Validate File Types

```typescript
// ✅ Good
uploadSingle("file", { allowedTypes: FileTypes.IMAGES });

// ❌ Bad - allows any file
uploadSingle("file");
```

### 2. Set Reasonable File Size Limits

```typescript
uploadSingle("file", {
  maxSize: 5 * 1024 * 1024, // 5MB - adjust based on needs
});
```

### 3. Sanitize Filenames

Already handled by the middleware (timestamp + random number).

### 4. Use Required Flag

```typescript
uploadSingle("avatar", { required: true });
```

### 5. Add Rate Limiting

```typescript
router.post(
  "/upload",
  strictRateLimit, // Prevent upload spam
  uploadSingle("file"),
  controller
);
```

## Advanced: Custom Storage

```typescript
import multer from "multer";

// Memory storage (file as buffer)
const memoryStorage = multer.memoryStorage();

// Use with cloud storage (AWS S3, etc)
export const uploadToMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file");
```

## Summary

### Quick Reference

- **Single file**: `uploadSingle(fieldName, options)`
- **Multiple files (same field)**: `uploadMultiple(fieldName, maxCount, options)`
- **Multiple fields**: `uploadFields([{name, maxCount}], options)`

### Options

- `allowedTypes`: File types array or use `FileTypes.*`
- `maxSize`: Size in bytes (5MB = `5 * 1024 * 1024`)
- `required`: Boolean (default: false)

### File Access

- Single: `req.file`
- Multiple: `req.files` (array)
- Fields: `req.files` (object)

Your file upload system is ready to use - simple as `authorize` middleware! 📁
