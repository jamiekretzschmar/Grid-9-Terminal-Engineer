
import { z } from "zod";

export const SovereigntyLevelSchema = z.enum(["DISCOVERY", "CONTROL", "SOVEREIGNTY"]);

export const ArtifactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, "Designation must be at least 3 characters"),
  content: z.string(),
  status: z.enum(["active", "archived"]),
  sovereigntyLevel: SovereigntyLevelSchema,
  lastModified: z.number(),
});

export const ManifestSchema = z.array(ArtifactSchema);

export type Artifact = z.infer<typeof ArtifactSchema>;
export type SovereigntyLevel = z.infer<typeof SovereigntyLevelSchema>;

export const validateImportData = (data: any) => {
  try {
    const result = ManifestSchema.safeParse(data);
    if (!result.success) {
      console.error("Manifest Integrity Violation:", result.error);
      return { valid: false, error: result.error.message };
    }
    return { valid: true, data: result.data };
  } catch (e) {
    return { valid: false, error: "Malformed JSON structure" };
  }
};
