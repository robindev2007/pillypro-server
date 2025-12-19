import z from "zod";

/**
 * Update profile validation schema
 */
const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters")
        .optional(),
      location: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      companyName: z.string().optional(),
    })
    .strict()
    .optional(),
});

/**
 * Get user by ID validation schema
 */
const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

export const UsersValidation = {
  updateProfileSchema,
  getUserByIdSchema,
};

// Export types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>["params"];
