import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";

// Configure memory storage - files stay in buffer, not written to disk
const storage = multer.memoryStorage();

// File filter for validation
const createFileFilter = (allowedTypes: string[], maxSize?: number) => {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    // Check file extension
    if (allowedTypes.includes(ext) || allowedTypes.includes(mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          httpStatus.BAD_REQUEST,
          `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
          {
            allowedTypes,
            receivedType: ext,
          }
        )
      );
    }
  };
};

/**
 * Upload configuration options
 */
interface UploadOptions {
  /** Allowed file types (extensions like '.jpg' or mimetypes like 'image/jpeg') */
  allowedTypes?: string[];
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
  /** Is file required? (default: false) */
  required?: boolean;
}

/**
 * Default file type groups
 */
export const FileTypes = {
  IMAGES: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  DOCUMENTS: [".pdf", ".doc", ".docx", ".txt", ".csv", ".xlsx"],
  VIDEOS: [".mp4", ".avi", ".mov", ".wmv", ".flv"],
  AUDIO: [".mp3", ".wav", ".ogg", ".m4a"],
  ALL: ["*"],
};

/**
 * Create upload middleware for single file
 * @param fieldName - Name of the form field
 * @param options - Upload options
 *
 * @example
 * router.post("/profile", uploadSingle("avatar", {
 *   allowedTypes: FileTypes.IMAGES,
 *   maxSize: 5 * 1024 * 1024,
 *   required: true
 * }), controller);
 */
export const uploadSingle = (
  fieldName: string,
  options: UploadOptions = {}
) => {
  const {
    allowedTypes = FileTypes.ALL,
    maxSize = 5 * 1024 * 1024, // 5MB default
    required = false,
  } = options;

  const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: createFileFilter(allowedTypes, maxSize),
  }).single(fieldName);

  return (req: Request, res: any, next: any) => {
    upload(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new AppError(
              httpStatus.BAD_REQUEST,
              `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
              { maxSize, field: fieldName }
            )
          );
        }
        return next(
          new AppError(httpStatus.BAD_REQUEST, `Upload error: ${err.message}`, {
            field: fieldName,
          })
        );
      }

      if (err) {
        return next(err);
      }

      // Check if file is required
      if (required && !req.file) {
        return next(
          new AppError(
            httpStatus.BAD_REQUEST,
            `File '${fieldName}' is required`,
            { field: fieldName }
          )
        );
      }

      next();
    });
  };
};

/**
 * Create upload middleware for multiple files (same field name)
 * @param fieldName - Name of the form field
 * @param maxCount - Maximum number of files
 * @param options - Upload options
 *
 * @example
 * router.post("/gallery", uploadMultiple("images", 5, {
 *   allowedTypes: FileTypes.IMAGES,
 *   required: true
 * }), controller);
 */
export const uploadMultiple = (
  fieldName: string,
  maxCount: number,
  options: UploadOptions = {}
) => {
  const {
    allowedTypes = FileTypes.ALL,
    maxSize = 5 * 1024 * 1024,
    required = false,
  } = options;

  const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: createFileFilter(allowedTypes, maxSize),
  }).array(fieldName, maxCount);

  return (req: Request, res: any, next: any) => {
    upload(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new AppError(
              httpStatus.BAD_REQUEST,
              `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
              { maxSize, field: fieldName }
            )
          );
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            new AppError(
              httpStatus.BAD_REQUEST,
              `Too many files. Maximum is ${maxCount}`,
              { maxCount, field: fieldName }
            )
          );
        }
        return next(
          new AppError(httpStatus.BAD_REQUEST, `Upload error: ${err.message}`, {
            field: fieldName,
          })
        );
      }

      if (err) {
        return next(err);
      }

      // Check if files are required
      if (
        required &&
        (!req.files || (req.files as Express.Multer.File[]).length === 0)
      ) {
        return next(
          new AppError(
            httpStatus.BAD_REQUEST,
            `At least one file for '${fieldName}' is required`,
            { field: fieldName }
          )
        );
      }

      next();
    });
  };
};

/**
 * Create upload middleware for multiple fields with different names
 * @param fields - Array of field configurations
 * @param options - Upload options
 *
 * @example
 * router.post("/documents", uploadFields([
 *   { name: "resume", maxCount: 1 },
 *   { name: "certificates", maxCount: 3 }
 * ], { allowedTypes: FileTypes.DOCUMENTS }), controller);
 */
export const uploadFields = (
  fields: Array<{ name: string; maxCount: number; required?: boolean }>,
  options: UploadOptions = {}
) => {
  const { allowedTypes = FileTypes.ALL, maxSize = 5 * 1024 * 1024 } = options;

  const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: createFileFilter(allowedTypes, maxSize),
  }).fields(fields.map((f) => ({ name: f.name, maxCount: f.maxCount })));

  return (req: Request, res: any, next: any) => {
    upload(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new AppError(
              httpStatus.BAD_REQUEST,
              `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
              { maxSize }
            )
          );
        }
        return next(
          new AppError(httpStatus.BAD_REQUEST, `Upload error: ${err.message}`)
        );
      }

      if (err) {
        return next(err);
      }

      // Check required fields
      const reqFiles = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      for (const field of fields) {
        if (
          field.required &&
          (!reqFiles ||
            !reqFiles[field.name] ||
            reqFiles[field.name]?.length === 0)
        ) {
          return next(
            new AppError(
              httpStatus.BAD_REQUEST,
              `File '${field.name}' is required`,
              { field: field.name }
            )
          );
        }
      }

      next();
    });
  };
};

/**
 * Accept any files (no validation)
 * Use with caution!
 */
export const uploadAny = () => {
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }).any();
};
