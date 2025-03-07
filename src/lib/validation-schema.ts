import { z } from "zod";

export const generateImageInputSchema = z.object({
  url: z.string().url(),
});

// Keep the old name for backward compatibility
export const generatePDFInputSchema = generateImageInputSchema;
