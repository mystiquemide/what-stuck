import { z } from "zod";
import { LIMITS } from "@/db/schema";

const isoDate = z.iso.date("Use a date like 2026-11-22.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const createSermonSchema = z.object({
  title: z.string().trim().min(1, "Give the sermon a title.").max(LIMITS.title),
  preachedOn: isoDate,
  scriptureRef: optionalText(LIMITS.scriptureRef),
  intendedTakeaway: z
    .string()
    .trim()
    .min(1, "Write the one thing you want people to leave with.")
    .max(LIMITS.intendedTakeaway, `Keep it under ${LIMITS.intendedTakeaway} characters.`),
  seriesId: z
    .uuid()
    .nullish()
    .transform((v) => v ?? null),
});

export const updateSermonSchema = createSermonSchema
  .partial()
  .extend({ status: z.enum(["open", "closed"]).optional() })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update.");

export const createSeriesSchema = z.object({
  title: z.string().trim().min(1, "Give the series a title.").max(LIMITS.title),
});

export type CreateSermonInput = z.infer<typeof createSermonSchema>;
export type UpdateSermonInput = z.infer<typeof updateSermonSchema>;
