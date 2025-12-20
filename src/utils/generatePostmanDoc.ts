import { ApiReferenceConfiguration } from "@scalar/express-api-reference";
import fs from "fs";
import path from "path";
import { createDocument } from "zod-openapi";

const getValidationFileUrls = (dir: string, extension = ".validation.ts") => {
  const result: Record<string, string> = {};

  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recurse into subdirectory
      const subResult = getValidationFileUrls(filePath, extension);
      Object.assign(result, subResult);
    } else if (file.endsWith(extension)) {
      const folderName = path.basename(path.dirname(filePath));
      result[folderName] = filePath; // full path
    }
  });

  return result;
};

const a: ApiReferenceConfiguration = {};

export const generatePostmanDoc = async () => {
  const files = getValidationFileUrls(process.cwd() + "/src/app");

  const schemas: Record<string, any[]> = {};

  // Loop through each validation file dynamically
  for (const [moduleName, filePath] of Object.entries(files)) {
    const importPath = filePath
      .replace(process.cwd() + "/", "")
      .replace(/\.ts$/, "");

    const file = await import(`@/${importPath}`);
    const validationKey = Object.keys(file)[0]; // e.g., AuthValidation, UsersValidation

    schemas[moduleName] = Object.entries(
      (file as any)[validationKey as any]
    ).map(([key, schema]) => ({
      key: key,
      schema: (schema as any)?.shape?.body || schema,
    }));
  }

  const paths: Record<string, any> = {};

  // Generate OpenAPI paths
  Object.entries(schemas).forEach(([moduleName, moduleSchemas]) => {
    moduleSchemas.forEach(({ key, schema }) => {
      const serviceFolder = moduleName.toLowerCase(); // e.g., "auth" or "users"
      const endpointKey = key.toLowerCase();

      const pathKey = `${serviceFolder}/${endpointKey}`;

      console.log({ pathKey });

      if (!paths[serviceFolder]) paths[serviceFolder] = {};
      paths[pathKey] = {
        post: {
          summary: `${toHumanReadable(key.replace("SCHEMA", ""))}`,
          requestBody: {
            content: {
              "application/json": {
                schema: schema,
              },
            },
          },
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      message: { type: "string" },
                      data: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      };
    });
  });

  return createDocument({
    openapi: "3.1.1",
    info: {
      title: "Pilly Pro API",
      version: "1.0.0",
      description: "API documentation for Pilly Pro",
    },
    paths,
  });
};

const toHumanReadable = (text: string) => {
  // Split before capital letters, but keep consecutive capitals together
  const words = text.match(/[A-Z]+(?![a-z])|[A-Z][a-z]*|[a-z]+/g);

  if (!words) return text;

  // Capitalize first word, leave others as is
  const result = words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");

  return result;
};
