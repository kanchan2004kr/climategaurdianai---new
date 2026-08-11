import { z } from "zod";

export const carbonCategoryEnum = z.enum([
  "TRANSPORT",
  "FUEL",
  "ELECTRICITY",
  "FLIGHTS",
  "FOOD",
  "SHOPPING",
]);

export const carbonRecordCreateSchema = z.object({
  category: carbonCategoryEnum,
  description: z.string().max(200).optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
});

export type CarbonRecordCreateInput = z.infer<typeof carbonRecordCreateSchema>;
export type CarbonCategoryEnum = z.infer<typeof carbonCategoryEnum>;
