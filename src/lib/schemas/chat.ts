import { z } from "zod";

export const chatMessageCreateSchema = z.object({
  chatSessionId: z.string().cuid().optional(),
  message: z.string().min(1).max(2000),
  locationId: z.string().min(1).optional(),
});

export type ChatMessageCreateInput = z.infer<typeof chatMessageCreateSchema>;
