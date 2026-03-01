import {z} from "zod";
import {BoardTypeSchema} from "./common";

export const TrackSourceNameSchema = z.enum(['list', 'youtube', 'file', 'url']);

export const TrackSourceSchema = z.object({
    type: TrackSourceNameSchema.refine(val => val !== 'list', {
        message: "'list' type is not allowed as a track source",
    }),
    src: z.string().optional()
});

export const TrackSchema = z.object({
    id: z.string(),
    source: TrackSourceSchema,
    title: z.string(),
    duration: z.number(),
    board: BoardTypeSchema.refine(val => val !== 'ambient', {
        message: "'ambient' type is not allowed as a track board"
    }),
    downloading: z.boolean().optional()
});

export const TracksSchema = z.object({
    tracks: z.array(TrackSchema).default([])
});

export type TrackSourceName = z.infer<typeof TrackSourceNameSchema>;
export type TrackSource = z.infer<typeof TrackSourceSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Tracks = z.infer<typeof TracksSchema>;