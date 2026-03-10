import {z} from "zod";

export const CacheSchema = z.object({
    profilesDir: z.string().nullable().default(null),
    audioDir: z.string().nullable().default(null),
});

export type Cache = z.infer<typeof CacheSchema>;
