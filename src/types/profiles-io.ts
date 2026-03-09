import {z} from "zod";
import {GridProfileSchema} from "./profiles";
import {TrackSchema} from "./tracks";

export const ExportTrackSchema = TrackSchema.omit({downloading: true});

export const ExportGridProfileSchema = GridProfileSchema.extend({tracks: z.array(ExportTrackSchema).default([])});

export type ExportTrack = z.infer<typeof ExportTrackSchema>;
export type ExportGridProfile = z.infer<typeof ExportGridProfileSchema>;