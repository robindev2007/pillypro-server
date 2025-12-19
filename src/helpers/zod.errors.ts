import { ZodError } from "zod";

// Assuming TErrorDetails and TGenericErrorResponse are defined elsewhere,
// we will define simple interfaces here for completeness, matching the usage.
interface TErrorDetails {
  issues: {
    path: string; // Now always uses the full path, e.g., 'body.email'
    message: string;
  }[];
}

interface TGenericErrorResponse {
  statusCode: number;
  message: string;
  errorDetails: TErrorDetails;
}

/**
 * Converts Zod’s technical messages into
 * human-friendly explanations for users, handling specific cases
 * like length, emails, and unrecognized keys.
 */
function formatZodMessage(field: string | number, rawMessage: string): string {
  // Cleans up the field name (e.g., 'email' -> 'Email')
  const readableField =
    typeof field === "string"
      ? field.charAt(0).toUpperCase() + field.slice(1)
      : "A required field";

  // 1. Required Field (Missing Value)
  if (rawMessage.includes("Required")) {
    if (readableField.toLowerCase() === "body") {
      return "No data provided in the request body.";
    }
    // Concise message: "Email is required."
    return `${readableField} is required.`;
  }

  // 2. Specific Format/Type Errors
  if (rawMessage.includes("Invalid email format")) {
    return `${readableField} is not a valid email address.`;
  }
  if (rawMessage.includes("Expected number")) {
    return `${readableField} must be a number.`;
  }
  if (rawMessage.includes("Expected string")) {
    return `${readableField} must be text.`;
  }
  if (rawMessage.includes("Expected date")) {
    return `${readableField} must be a valid date.`;
  }

  // 3. Length/Size Constraints (Min)
  const minMatch = rawMessage.match(
    /String must contain at least (\d+) character/
  );
  if (minMatch) {
    const minCount = minMatch[1];
    return `${readableField} must be at least ${minCount} characters long.`;
  }

  // 4. Length/Size Constraints (Max)
  const maxMatch = rawMessage.match(
    /String must contain at most (\d+) character/
  );
  if (maxMatch) {
    const maxCount = maxMatch[1];
    return `${readableField} cannot exceed ${maxCount} characters.`;
  }

  // 5. Strict Object/Unrecognized Keys (when using .strict())
  if (rawMessage.includes("Unrecognized key(s)")) {
    // Extracts the list of extra keys, e.g., 'extraField', 'another'
    const keyMatch = rawMessage.match(
      /Unrecognized key\(s\) in object: (.*)\./
    );
    if (keyMatch && keyMatch[1]) {
      // Clean up the keys for display
      const keys = keyMatch[1].replace(/'/g, "").trim();

      // If the field is 'Body', 'Query', or 'Params', tailor the message
      if (["body", "query", "params"].includes(readableField)) {
        return `Extra field(s) (${keys}) found in the ${readableField} that are not allowed.`;
      }
      return `The extra field(s) (${keys}) are not allowed.`;
    }
  }

  // 6. General Invalid/Fallback
  if (rawMessage.includes("Invalid") || rawMessage.includes("Expected")) {
    return `${readableField} has an invalid value or incorrect format.`;
  }

  // Default fallback (should rarely be hit)
  return `${readableField}: ${rawMessage}`;
}

/**
 * Handles Zod validation errors and provides
 * user-friendly, readable messages.
 *
 * It provides a short, concise message for the toast/UI,
 * and detailed errors in the errorDetails object for form field validation.
 */
const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const statusCode = 400; // Standard for client-side validation failures

  // Map each Zod issue into a clear field + message pair
  const issues = err.issues.map((issue: ZodError["issues"][0]) => {
    // **FIX**: Use the full path (e.g., 'body.email') for client mapping
    const specificPath = issue.path.join(".");

    // The field name used for message formatting is the last element
    const field = issue.path[issue.path.length - 1] as string;

    return {
      path: specificPath, // e.g., 'body.email'
      message: formatZodMessage(field, issue.message),
    };
  });

  // --- Core Logic: Simplifying the Main Message for Toasts ---
  let summary: string;

  if (issues.length === 0) {
    summary = "Validation failed due to an unexpected error.";
  } else if (issues.length === 1) {
    summary =
      issues[0]?.message ?? "Validation failed due to an unexpected error.";
  } else if (issues.length <= 5) {
    // Show all fields in one summary for a few errors
    const fieldList = issues.map((i) => i.path.split(".").pop()).join(", ");
    summary = `${fieldList} have invalid values or incorrect format.`;
  } else {
    // For many errors, keep it generic
    summary = `Found ${issues.length} input errors. Please review your form input.`;
  }

  // The final message is just the short summary.
  const message = summary;

  // The issues array remains detailed for form field highlighting.
  const errorDetails: TErrorDetails = { issues };

  return {
    statusCode,
    message,
    errorDetails,
  };
};

export default handleZodError;
