import env from "@/config/env";
import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { logger } from "@/utils/logger";
import fs from "fs";
import path from "path";

// ============================================================
// FILE UPLOAD SERVICE
// ============================================================

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const BASE_URL = env.BASE_URL_SERVER_DEV || "http://localhost:5000";

/**
 * Get file type category from mimetype
 */
const getFileTypeFolder = (mimetype: string): string => {
  if (mimetype.startsWith("image/")) return "images";
  if (mimetype.startsWith("video/")) return "videos";
  if (mimetype.startsWith("audio/")) return "audios";
  if (
    mimetype.includes("pdf") ||
    mimetype.includes("document") ||
    mimetype.includes("text") ||
    mimetype.includes("spreadsheet")
  )
    return "documents";
  return "others";
};

/**
 * Ensure upload directory and subdirectories exist
 */
const ensureUploadDir = (subDir?: string) => {
  const targetDir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    logger.info(`[ UPLOAD ] Created directory: ${targetDir}`);
  }
};

// Initialize upload directory
ensureUploadDir();

// ============================================================
// TYPE-SAFE UPLOAD FUNCTIONS
// ============================================================

/**
 * Upload file(s) with type safety
 * Writes file buffer to disk and returns URL
 */
function uploadFiles(file: Express.Multer.File): string;
function uploadFiles(files: Express.Multer.File[]): string[];
function uploadFiles(
  input: Express.Multer.File | Express.Multer.File[]
): string | string[] {
  // Handle single file
  if (!Array.isArray(input)) {
    if (!input) {
      throw new AppError(httpStatus.BAD_REQUEST, "No file provided");
    }

    // Determine file type folder
    const typeFolder = getFileTypeFolder(input.mimetype);
    ensureUploadDir(typeFolder);

    // Generate unique filename
    const uniqueId = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    const fileExtension = path.extname(input.originalname);
    const filename = `${uniqueId}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, typeFolder, filename);

    // Write buffer to disk
    fs.writeFileSync(filePath, input.buffer);

    const fileUrl = `${BASE_URL}/uploads/${typeFolder}/${filename}`;
    logger.info(`[ UPLOAD ] File uploaded: ${typeFolder}/${filename}`);
    return fileUrl;
  }

  // Handle multiple files
  if (!input || input.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "No files provided");
  }

  const fileUrls = input.map((file) => {
    // Determine file type folder
    const typeFolder = getFileTypeFolder(file.mimetype);
    ensureUploadDir(typeFolder);

    // Generate unique filename
    const uniqueId = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    const fileExtension = path.extname(file.originalname);
    const filename = `${uniqueId}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, typeFolder, filename);

    // Write buffer to disk
    fs.writeFileSync(filePath, file.buffer);

    return `${BASE_URL}/uploads/${typeFolder}/${filename}`;
  });

  logger.info(`[ UPLOAD ] ${input.length} files uploaded`);
  return fileUrls;
}

// ============================================================
// TYPE-SAFE DELETE FUNCTIONS
// ============================================================

/**
 * Delete file(s) with type safety
 * Accepts single URL or array of URLs
 */
function deleteFiles(fileUrl: string): void;
function deleteFiles(fileUrls: string[]): void;
function deleteFiles(input: string | string[]): void {
  // Handle single file URL
  if (typeof input === "string") {
    try {
      // Extract path after /uploads/ (includes folder structure)
      const relativePath = input.split("/uploads/").pop();

      if (!relativePath) {
        logger.warning(`[ UPLOAD ] Invalid file URL: ${input}`);
        return;
      }

      const filePath = path.join(UPLOAD_DIR, relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`[ UPLOAD ] File deleted: ${relativePath}`);
      } else {
        logger.warning(`[ UPLOAD ] File not found: ${relativePath}`);
      }
    } catch (error: any) {
      logger.error(`[ UPLOAD ] Error deleting file: ${error.message}`);
    }
    return;
  }

  // Handle multiple file URLs
  if (!input || input.length === 0) {
    return;
  }

  input.forEach((fileUrl) => {
    deleteFiles(fileUrl);
  });

  logger.info(`[ UPLOAD ] ${input.length} files deleted`);
}

/**
 * Upload new file and delete old file
 * @param newFile - New file to upload
 * @param oldFileUrl - Old file URL to delete (optional)
 * @returns New file URL
 */
const uploadAndReplace = (
  newFile: Express.Multer.File,
  oldFileUrl?: string | null
): string => {
  // Delete old file if exists
  if (oldFileUrl) {
    deleteFiles(oldFileUrl);
  }

  // Upload new file
  return uploadFiles(newFile);
};

/**
 * Delete file by path (helper for cleanup)
 */
const deleteFileByPath = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[ UPLOAD ] File deleted: ${filePath}`);
    }
  } catch (error: any) {
    logger.error(`[ UPLOAD ] Error deleting file: ${error.message}`);
  }
};

/**
 * Get file info (after upload)
 */
const getFileInfo = (fileUrl: string, file: Express.Multer.File) => {
  const filename = fileUrl.split("/uploads/").pop() || "";

  return {
    filename: filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: fileUrl,
  };
};

export const FileUploadService = {
  uploadFiles,
  deleteFiles,
  uploadAndReplace,
  deleteFileByPath,
  getFileInfo,
};
