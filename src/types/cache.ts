import {z} from "zod";

export const CacheSchema = z.object({
    profilesDir: z.string().nullable(),
    audioDir: z.string().nullable(),
});

export type Cache = z.infer<typeof CacheSchema>;
