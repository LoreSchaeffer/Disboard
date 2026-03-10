import {z} from "zod";
import {AmbientBtnSchema, GridBtnSchema} from "./buttons";
import {BoardTypeSchema} from "./common";

export const GridProfileSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    type: BoardTypeSchema.refine(val => val !== 'ambient', {
        message: "'ambient' type is not allowed as a grid profile type",
    }),
    rows: z.number().int().min(1).max(50),
    cols: z.number().int().min(1).max(50),
    buttons: z.array(GridBtnSchema)
});

export const AmbientProfileSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    type: BoardTypeSchema.refine(val => val === 'ambient', {
        message: "'ambient' type is the only type allowed as an ambient profile type",
    }),
    buttons: z.array(AmbientBtnSchema)
});

export const GridProfilesSchema = z.object({
    profiles: z.array(GridProfileSchema).default([])
});

export const AmbientProfilesSchema = z.object({
    profiles: z.array(AmbientProfileSchema).default([])
});

export type GridProfile = z.infer<typeof GridProfileSchema>;
export type AmbientProfile = z.infer<typeof AmbientProfileSchema>;
export type GridProfiles = z.infer<typeof GridProfilesSchema>;
export type AmbientProfiles = z.infer<typeof AmbientProfilesSchema>;