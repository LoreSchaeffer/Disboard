import {z} from "zod";

export const CacheSchema = z.object({
    profilesDir: z.string().nullable().default(null),
    audioDir: z.string().nullable().default(null),
    unreachableUrls: z.array(z.string()).default([]),
});

export type Cache = z.infer<typeof CacheSchema>;
