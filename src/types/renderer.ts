import {z} from "zod";
import {TrackSchema} from "./tracks";
import {AmbientBtnSchema, CropOptionsSchema, GridBtnSchema} from "./buttons";
import {AmbientProfileSchema, GridProfileSchema} from "./profiles";

export const PlayerTrackSchema = TrackSchema.extend({
    cropOptions: CropOptionsSchema.optional(),
    directStream: z.boolean().default(false).optional(),
    titleOverride: z.string().optional(),
    volumeOverride: z.number().min(0).max(100).optional()
});

export const SbGridBtnSchema = GridBtnSchema
    .omit({track: true})
    .extend({
        track: TrackSchema.optional()
    });

export const SbGridProfileSchema = GridProfileSchema
    .omit({buttons: true})
    .extend({
        buttons: z.array(SbGridBtnSchema)
    });

export const SbAmbientBtnSchema = AmbientBtnSchema; //TODO

export const SbAmbientProfileSchema = AmbientProfileSchema
    .omit({buttons: true})
    .extend({
        buttons: z.array(SbAmbientBtnSchema)
    });

export type PlayerTrack = z.infer<typeof PlayerTrackSchema>;
export type SbGridBtn = z.infer<typeof SbGridBtnSchema>;
export type SbGridProfile = z.infer<typeof SbGridProfileSchema>;
export type SbAmbientBtn = z.infer<typeof SbAmbientBtnSchema>;
export type SbAmbientProfile = z.infer<typeof SbAmbientProfileSchema>;