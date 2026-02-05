import {z} from "zod";

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const TimeUnitSchema = z.enum(['ms', 's', 'm']);

export const EndTimeTypeSchema = z.enum(['at', 'after']);

export const TrackSourceSchema = z.enum(['list', 'youtube', 'file', 'url']);


export const BtnStyleSchema = z.object({
    textColor: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    textColorHover: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    textColorActive: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    backgroundColor: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    backgroundColorHover: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    backgroundColorActive: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    borderColor: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    borderColorHover: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    borderColorActive: z.string().regex(hexColorRegex, "Invalid Hex").optional(),
    autoPick: z.boolean().optional()
});

export const CropOptionsSchema = z.object({
    startTime: z.number().min(0).optional(),
    startTimeUnit: TimeUnitSchema.optional(),
    endTimeType: EndTimeTypeSchema.optional(),
    endTime: z.number().min(0).optional(),
    endTimeUnit: TimeUnitSchema.optional()
});

export const BtnSchema = z.object({
    row: z.number().int().min(0).max(49),
    col: z.number().int().min(0).max(49),
    track: z.uuid(),
    title: z.string().optional(),
    volumeOverride: z.number().min(0).max(100).optional(),
    style: BtnStyleSchema.optional(),
    cropOptions: CropOptionsSchema.optional()
});

export const ProfileSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    rows: z.number().int().min(1).max(50),
    cols: z.number().int().min(1).max(50),
    buttons: z.array(BtnSchema)
});

export const ProfilesSchema = z.object({
    profiles: z.array(ProfileSchema).default([])
});

export const SfxSchema = z.object({
    title: z.string(),
    track: z.uuid(),
    volumeOverride: z.number().min(0).max(100).optional()
});

export const SfxProfileSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    sfx: z.array(SfxSchema)
});

export const SfxProfilesSchema = z.object({
    profiles: z.array(SfxProfileSchema).default([])
});


export const SourceSchema = z.object({
    type: TrackSourceSchema.refine(val => val !== 'list', {
        message: "'list' type is not allowed in Source",
    }),
    src: z.string().optional()
});

export const TrackSchema = z.object({
    id: z.string(),
    source: SourceSchema,
    title: z.string(),
    duration: z.number(),
    downloading: z.boolean().optional()
});

export const SbBtnSchema = z.object({
    id: z.string().optional(),
    row: z.number().int().min(0).max(49),
    col: z.number().int().min(0).max(49),
    track: TrackSchema,
    title: z.string(),
    volumeOverride: z.number().min(0).max(100).optional(),
    style: BtnStyleSchema.optional(),
    cropOptions: CropOptionsSchema.optional()
});

export const SbProfileSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    rows: z.number().int().min(1).max(50),
    cols: z.number().int().min(1).max(50),
    buttons: z.array(SbBtnSchema)
});

export const TracksSchema = z.object({
    tracks: z.array(TrackSchema).default([])
});

export const PlayerTrackSchema = TrackSchema.extend({
    cropOptions: CropOptionsSchema.optional(),
    directStream: z.boolean().default(false).optional(),
    titleOverride: z.string().optional(),
    volumeOverride: z.number().min(0).max(100).optional()
});

export type TimeUnit = z.infer<typeof TimeUnitSchema>;
export type EndTimeType = z.infer<typeof EndTimeTypeSchema>;
export type BtnStyle = z.infer<typeof BtnStyleSchema>;
export type CropOptions = z.infer<typeof CropOptionsSchema>;
export type Btn = z.infer<typeof BtnSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Profiles = z.infer<typeof ProfilesSchema>;
export type Sfx = z.infer<typeof SfxSchema>;
export type SfxProfile = z.infer<typeof SfxProfileSchema>;
export type SfxProfiles = z.infer<typeof SfxProfilesSchema>;
export type Data = z.infer<typeof ProfilesSchema>;
export type SbBtn = z.infer<typeof SbBtnSchema>;
export type SbProfile = z.infer<typeof SbProfileSchema>;

export type TrackSource = z.infer<typeof TrackSourceSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Tracks = z.infer<typeof TracksSchema>;
export type PlayerTrack = z.infer<typeof PlayerTrackSchema>;