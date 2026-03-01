import {BoardTypeSchema, RepeatModeSchema} from "./common";
import {z} from "zod";

export const ApiCredentialsSchema = z.object({
    clientId: z.string().default(''),
    clientSecret: z.string().default('')
});

export const DiscordSettingsSchema = z.object({
    enabled: z.boolean().default(false),
    token: z.string().optional(),
    restPort: z.number().min(1).max(65535).default(24454),
    udpPort: z.number().min(1).max(65535).default(24455),
    lastGuild: z.string().optional(),
    lastChannel: z.string().optional(),
});

export const SoundboardSettingsSchema = z.object({
    width: z.number().min(1080).max(10000).default(1366),
    height: z.number().min(608).max(10000).default(768),
    volume: z.number().min(0).max(100).default(50),
    activeProfile: z.uuid().nullable().default(null),
});

export const SettingsSchema = z.object({
    openOnStartup: z.array(BoardTypeSchema).default(['music']),

    mainSoundboard: SoundboardSettingsSchema.extend({repeat: RepeatModeSchema.default('none')}).default({width: 1366, height: 768, volume: 50, activeProfile: null, repeat: 'none'}),
    clickSoundboard: SoundboardSettingsSchema.default({width: 1366, height: 768, volume: 50, activeProfile: null}),
    sfxSoundboard: SoundboardSettingsSchema.default({width: 1366, height: 768, volume: 50, activeProfile: null}),

    previewVolume: z.number().min(0).max(100).default(50),
    outputDevice: z.string().default('default'),
    previewOutputDevice: z.string().default('default'),

    zoom: z.number().min(0.5).max(3).default(1),
    showImages: z.boolean().default(true),
    confirmButtonDeletion: z.boolean().default(true),

    musicApi: z.url().or(z.literal('')).default('https://ma.lycoris.it'),
    musicApiCredentials: ApiCredentialsSchema.nullable().default(null),

    discord: DiscordSettingsSchema.default({enabled: false, restPort: 24454, udpPort: 24455}),

    debug: z.boolean().default(false)
});

export type SoundboardSettings = z.infer<typeof SoundboardSettingsSchema>;
export type ApiCredentials = z.infer<typeof ApiCredentialsSchema>;
export type DiscordSettings = z.infer<typeof DiscordSettingsSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
