import { z } from "zod";

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const locationCreateSchema = geoPointSchema.extend({
  name: z.string().min(1).max(120),
  city: z.string().max(120).optional(),
  region: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  isPrimary: z.boolean().optional(),
});

export const citySearchSchema = z.object({
  query: z.string().min(2).max(100),
});

export type LocationCreateInput = z.infer<typeof locationCreateSchema>;
