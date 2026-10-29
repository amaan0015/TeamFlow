
import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .max(254)
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});


export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .max(254)
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password is too long"),
});

