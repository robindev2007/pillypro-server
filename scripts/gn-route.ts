import fs from "fs";
import path from "path";
import readline from "readline";

// ---------- helpers ----------
const toKebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

const toPascalCase = (str: string) =>
  str
    .split(/[-_\s]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

// ---------- interactive prompt ----------
const askOverwriteAll = (files: string[]) => {
  return new Promise<boolean>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log("The following files already exist:");
    files.forEach((f) => console.log("  " + f));
    rl.question("⚠️ Overwrite all these files? (y/N) ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
};

// ---------- args ----------
const moduleName = process.argv[2];
const force = process.argv.includes("--force") || process.argv.includes("-f");

if (!moduleName) {
  console.error("❌ Please provide a module name");
  process.exit(1);
}

const kebabName = toKebabCase(moduleName);
const pascalName = toPascalCase(moduleName);

const baseDir = path.join("src", "app", kebabName);
const prismaDir = path.join("prisma", "schema"); // separate folder for new prisma files
const routesIndexPath = path.join("src", "app", "routes", "index.ts");

// ---------- create folders ----------
fs.mkdirSync(baseDir, { recursive: true });
fs.mkdirSync(prismaDir, { recursive: true });

const typesTemplate = `
export type I${pascalName} = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type I${pascalName}Filters = {
  searchTerm?: string;
  page?: number;
  limit?: number;
};
`;

const validationTemplate = `
import { z } from 'zod';

export const create = z.object({
  body: z.object({}),
});

export const update = z.object({
  body: z.object({}),
});

export const ${pascalName}Validation = { create, update };

export type Create${pascalName}Input = z.infer<typeof create>;
export type Update${pascalName}Input = z.infer<typeof update>;
`;

const serviceTemplate = `
import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import { FileUploadService } from "@/services/fileUpload";
import type { Request } from "express";
import type { Create${pascalName}Input, Update${pascalName}Input } from "./${kebabName}.validation";

/**
 * Get all ${pascalName}s
 */
const getAll${pascalName}s = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.${moduleName.toLowerCase()},
    {
      searchFields: [], // add searchable fields
      filterFields: [], // add filterable fields
      booleanFields: [],
      defaultLimit: 10,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    },
    {
      id: true,
      createdAt: true,
      updatedAt: true,
    }
  );
};

/**
 * Get ${pascalName} by ID
 */
const get${pascalName}ById = async (id: string) => {
  const record = await prisma.${moduleName.toLowerCase()}.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "${pascalName} not found");

  return record;
};

/**
 * Create ${pascalName}
 */
const create${pascalName} = async (payload: Create${pascalName}Input) => {
  return prisma.${moduleName.toLowerCase()}.create({ data: payload });
};

/**
 * Update ${pascalName}
 */
const update${pascalName} = async (id: string, payload: Update${pascalName}Input, file?: Express.Multer.File) => {
  const record = await prisma.${moduleName.toLowerCase()}.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "${pascalName} not found");

  if (file) {
    (payload as any).fileField = FileUploadService.uploadAndReplace(file, (record as any).fileField);
  }

  return prisma.${moduleName.toLowerCase()}.update({
    where: { id },
    data: payload,
    select: { id: true, createdAt: true, updatedAt: true },
  });
};

/**
 * Delete ${pascalName}
 */
const delete${pascalName} = async (id: string) => {
  const record = await prisma.${moduleName.toLowerCase()}.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "${pascalName} not found");

  if ((record as any).fileField) FileUploadService.deleteFiles((record as any).fileField);

  await prisma.${moduleName.toLowerCase()}.delete({ where: { id } });

  return { message: "${pascalName} deleted successfully" };
};

export const ${pascalName}Service = {
  getAll${pascalName}s,
  get${pascalName}ById,
  create${pascalName},
  update${pascalName},
  delete${pascalName},
};
`;

const controllerTemplate = `
import httpStatus from 'http-status';
import handleController from '@/helpers/handleController';
import sendResponse from '@/helpers/sendResponse';
import { ${pascalName}Service } from './${kebabName}.service';
import type { Request, Response } from 'express';

const create = handleController(async (req: Request, res: Response) => {
  const result = await ${pascalName}Service.create${pascalName}(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, message: '${pascalName} created successfully', data: result });
});

const getAll = handleController(async (req: Request, res: Response) => {
  const result = await ${pascalName}Service.getAll${pascalName}s(req);
  sendResponse(res, { statusCode: httpStatus.OK, message: '${pascalName}s retrieved successfully', meta: result.meta, data: result.data });
});

const getOne = handleController(async (req: Request, res: Response) => {
  const result = await ${pascalName}Service.get${pascalName}ById(req.params.id!);
  sendResponse(res, { statusCode: httpStatus.OK, message: '${pascalName} retrieved successfully', data: result });
});

const update = handleController(async (req: Request, res: Response) => {
  const result = await ${pascalName}Service.update${pascalName}(req.params.id!, req.body, req.file);
  sendResponse(res, { statusCode: httpStatus.OK, message: '${pascalName} updated successfully', data: result });
});

const remove = handleController(async (req: Request, res: Response) => {
  const result = await ${pascalName}Service.delete${pascalName}(req.params.id!);
  sendResponse(res, { statusCode: httpStatus.OK, message: '${pascalName} deleted successfully', data: result });
});

export const ${pascalName}Controller = { create, getAll, getOne, update, remove };
`;

const routeTemplate = `
import express from 'express';
import { ${pascalName}Controller } from './${kebabName}.controller';

const router = express.Router();

router.post('/', ${pascalName}Controller.create);
router.get('/', ${pascalName}Controller.getAll);
router.get('/:id', ${pascalName}Controller.getOne);
router.patch('/:id', ${pascalName}Controller.update);
router.delete('/:id', ${pascalName}Controller.remove);

export const ${pascalName}Routes = router;
`;

const constantTemplate = `
export const ${pascalName}SearchableFields = ['id', 'name'];
`;

const prismaFileName = `${kebabName}.prisma`;
const prismaFilePath = path.join(prismaDir, prismaFileName);
const prismaTemplate = `
model ${pascalName} {
  id   String @id @default(cuid())
  name String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("${kebabName}s")
}
`;

// ---------- templates ----------
const templates: Record<string, string> = {
  [`${kebabName}.types.ts`]: typesTemplate,
  [`${kebabName}.validation.ts`]: validationTemplate,
  [`${kebabName}.service.ts`]: serviceTemplate,
  [`${kebabName}.controller.ts`]: controllerTemplate,
  [`${kebabName}.route.ts`]: routeTemplate,
  [`${kebabName}.constant.ts`]: constantTemplate,
};

(async () => {
  // Check existing files first
  const allFiles = Object.keys(templates)
    .map((f) => path.join(baseDir, f))
    .concat(prismaFilePath);
  const existingFiles = allFiles.filter((f) => fs.existsSync(f));

  let overwriteAll = false;
  if (existingFiles.length > 0) {
    if (force) {
      overwriteAll = true;
    } else {
      overwriteAll = await askOverwriteAll(existingFiles);
    }
  }

  // Write templates
  for (const [fileName, template] of Object.entries(templates)) {
    const filePath = path.join(baseDir, fileName);
    if (!fs.existsSync(filePath) || overwriteAll) {
      fs.writeFileSync(filePath, template);
      console.log(
        `${
          fs.existsSync(filePath) ? "♻️  Overwritten" : "✅ Created"
        }: ${filePath}`
      );
    } else {
      console.log(`⚠️ Skipped: ${filePath}`);
    }
  }

  // Write Prisma
  if (!fs.existsSync(prismaFilePath) || overwriteAll) {
    fs.writeFileSync(prismaFilePath, prismaTemplate);
    console.log(
      `${
        fs.existsSync(prismaFilePath) ? "♻️  Overwritten" : "✅ Created"
      }: ${prismaFilePath}`
    );
  } else {
    console.log(`⚠️ Skipped: ${prismaFilePath}`);
  }

  // Update routes index
  if (fs.existsSync(routesIndexPath)) {
    let content = fs.readFileSync(routesIndexPath, "utf8");
    const importLine = `import { ${pascalName}Routes } from '../${kebabName}/${kebabName}.route';`;
    if (!content.includes(importLine)) content = importLine + "\n" + content;
    const routeEntry = `{ path: '/${kebabName}', route: ${pascalName}Routes }`;
    if (!content.includes(routeEntry)) {
      content = content.replace(
        /const moduleRoutes = \[/,
        `const moduleRoutes = [\n  ${routeEntry},`
      );
      fs.writeFileSync(routesIndexPath, content);
      console.log(`✅ Routes index updated with: ${pascalName}Routes`);
    }
  }

  console.log(`✨ Module "${pascalName}" generation completed`);
})();
