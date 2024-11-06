import { z } from "zod";

export const generatePDFInputSchema = z.object({
  url: z.string().url(),
});
