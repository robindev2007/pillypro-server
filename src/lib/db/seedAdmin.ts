import env from "@/config/env";
import { logger } from "@/utils/logger";
import bcrypt from "bcrypt";
import { prisma } from "./index";

/**
 * Seed default super admin account if not exists
 */
export const seedSuperAdmin = async () => {
  try {
    const adminEmail = "admin@admin.com";

    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
      },
    });

    if (existingAdmin) {
      logger.info("[ SEED ] Super admin already exists");
      return;
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash(
      env.SUPER_ADMIN_PASSWORD,
      env.BCRYPT_SALT_ROUNDS
    );

    // Create super admin account
    const admin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        location: "System",
        role: "SUPER_ADMIN",
        passwordHashed: hashedPassword,
        isAccountVerified: true, // Pre-verified
        isAgreeWithTerms: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    logger.success(`[ SEED ] Super admin created successfully`);
    logger.info(`[ SEED ] Email: ${admin.email}`);
    logger.info(`[ SEED ] Password: ${env.SUPER_ADMIN_PASSWORD}`);
  } catch (error: any) {
    logger.error(`[ SEED ] Error creating super admin: ${error.message}`);
  }
};
