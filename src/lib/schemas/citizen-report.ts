import { z } from "zod";

export const citizenReportTypeEnum = z.enum([
  "FLOODING",
  "EXTREME_HEAT",
  "SEVERE_POLLUTION",
  "WATER_SHORTAGE",
  "WILDFIRE_SMOKE",
  "UNSAFE_WATER",
  "INFRASTRUCTURE_DAMAGE",
  "OTHER",
]);

export const alertSeverityEnum = z.enum(["INFO", "WARNING", "SEVERE", "EXTREME"]);

export const citizenReportCreateSchema = z.object({
  type: citizenReportTypeEnum,
  severity: alertSeverityEnum,
  description: z.string().min(5).max(1000),
  imageUrl: z.string().url().max(2048).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationId: z.string().min(1).optional(),
});

export const citizenReportStatusEnum = z.enum(["SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "RESOLVED"]);

export const citizenReportReviewSchema = z.object({
  status: citizenReportStatusEnum,
});

export type CitizenReportCreateInput = z.infer<typeof citizenReportCreateSchema>;
export type CitizenReportReviewInput = z.infer<typeof citizenReportReviewSchema>;
