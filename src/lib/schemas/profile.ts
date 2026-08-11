import { z } from "zod";

export const ageGroupEnum = z.enum(["CHILD", "YOUTH", "ADULT", "SENIOR"]);
export const vulnerabilityCategoryEnum = z.enum([
  "NONE",
  "RESPIRATORY",
  "CARDIOVASCULAR",
  "PREGNANT",
  "ELDERLY",
  "CHILD",
  "OUTDOOR_WORKER",
]);

export const profileUpdateSchema = z.object({
  ageGroup: ageGroupEnum.optional(),
  vulnerabilityCategory: vulnerabilityCategoryEnum.optional(),
  outdoorWorker: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  notifyAqi: z.boolean().optional(),
  notifyHeat: z.boolean().optional(),
  notifyRain: z.boolean().optional(),
  notifyFlood: z.boolean().optional(),
  notifyWater: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
