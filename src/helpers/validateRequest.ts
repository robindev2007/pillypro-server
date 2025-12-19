import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateRequest =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // --- Custom Body Parsing Logic (Preserved) ---
      // This logic handles multipart form data where data might be nested under a 'data' key
      if (req.body && req.body.data) {
        try {
          req.body = JSON.parse(req.body.data);
        } catch (error) {
          return next(new Error("Invalid JSON format in data property"));
        }
      } // --- End Custom Body Parsing Logic ---
      // **CORE FIX: Dynamically building the validation payload**
      // Cast schema to access the 'shape' property to see what keys it defines
      const schemaShape = (schema as any).shape;
      const validationTarget: { [key: string]: any } = {}; // Check if the schema has a 'body' definition. If so, include req.body.

      if ("body" in schemaShape) {
        validationTarget.body = req.body;
      } // Check if the schema has a 'query' definition. If so, include req.query.

      if ("query" in schemaShape) {
        validationTarget.query = req.query;
      } // Check if the schema has a 'params' definition. If so, include req.params.

      if ("params" in schemaShape) {
        validationTarget.params = req.params;
      } // Log the final object being validated

      await schema.parseAsync(validationTarget); // If successful, continue

      return next();
    } catch (err) {
      // Pass the Zod error to the global error handler
      next(err);
    }
  };

export default validateRequest;
