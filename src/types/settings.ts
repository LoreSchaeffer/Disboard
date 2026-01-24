import {RepeatModeSchema} from "./common";
import {z} from "zod";

export const ApiCredentialsSchema = z.object({
    clientId: z.string().default(''),
    clientSecret: z.string().default('')
});

export const DiscordSettingsSchema = z.object({
    enabled: z.boolean().default(false),
    token: z.string().optional(),
    defaultGuild: z.string().optional(),
    defaultChannel: z.string().optional(),
    joinAutomatically: z.boolean().default(false)
});

export const SettingsSchema = z.object({
    width: z.number().min(1080).max(10000).default(1366),
    height: z.number().min(608).max(10000).default(768),
    volume: z.number().min(0).max(100).default(50),
    previewVolume: z.number().min(0).max(100).default(50),
    outputDevice: z.string().default('default'),
    previewOutputDevice: z.string().default('default'),
    repeat: RepeatModeSchema.default('none'),
    activeProfile: z.string().nullable().default(null),
    zoom: z.number().min(0.5).max(3).default(1),
    showImages: z.boolean().default(true),
    musicApi: z.url().or(z.literal('')).default('https://ma.lycoris.it'),
    musicApiCredentials: ApiCredentialsSchema.optional().default(null),
    discord: DiscordSettingsSchema.default({enabled: false, joinAutomatically: false}),
    debug: z.boolean().default(false)
});

export type ApiCredentials = z.infer<typeof ApiCredentialsSchema>;
export type DiscordSettings = z.infer<typeof DiscordSettingsSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
