import {BoardTypeSchema, RepeatModeSchema} from "./common";
import {z} from "zod";

export const ApiCredentialsSchema = z.object({
    clientId: z.string().default(''),
    clientSecret: z.string().default('')
});

export const DiscordSettingsSchema = z.object({
    enabled: z.boolean().default(false),
    token: z.string().optional(),
    lastGuild: z.string().optional(),
    lastChannel: z.string().optional(),
});

export const WindowPositionSchema = z.object({
    x: z.number().optional(),
    y: z.number().optional(),
});

export const BoardSettingsSchema = z.object({
    width: z.number().min(1080).max(10000).default(1366),
    height: z.number().min(608).max(10000).default(768),
    position: WindowPositionSchema.optional(),
    volume: z.number().min(0).max(100).default(50),
    activeProfile: z.uuid().nullable().default(null),
    zoom: z.number().min(0.5).max(3).default(1),
});

export const RemoteServerSchema = z.object({
    enabled: z.boolean().default(false),
    port: z.number().min(1).max(65535).default(4466),
    authEnabled: z.boolean().default(false),
    username: z.string().optional().default(''),
    password: z.string().optional().default(''),
});

export const SettingsSchema = z.object({
    openOnStartup: z.array(BoardTypeSchema).default(['music']),

    music: BoardSettingsSchema.extend({
            repeat: RepeatModeSchema.default('none'),
            shuffle: z.boolean().default(false),
        }
    ).default({
        width: 1366,
        height: 768,
        volume: 50,
        activeProfile: null,
        zoom: 1,
        repeat: 'none',
        shuffle: false
    }),
    sfx: BoardSettingsSchema.default({width: 1366, height: 768, volume: 50, activeProfile: null, zoom: 1}),
    ambient: BoardSettingsSchema.default({width: 1366, height: 768, volume: 50, activeProfile: null, zoom: 1}),

    previewVolume: z.number().min(0).max(100).default(50),
    outputDevice: z.string().default('default'),
    previewOutputDevice: z.string().default('default'),

    showImages: z.boolean().default(true),
    confirmButtonDeletion: z.boolean().default(true),

    musicApi: z.url().or(z.literal('')).default('https://ma.lycoris.it'),
    musicApiCredentials: ApiCredentialsSchema.nullable().default(null),

    discord: DiscordSettingsSchema.default({enabled: false}),

    remoteServer: RemoteServerSchema.default({enabled: false, port: 4466, authEnabled: false, username: '', password: ''}),

    debug: z.boolean().default(false)
});

export type WindowPosition = z.infer<typeof WindowPositionSchema>;
export type BoardSettings = z.infer<typeof BoardSettingsSchema>;
export type ApiCredentials = z.infer<typeof ApiCredentialsSchema>;
export type DiscordSettings = z.infer<typeof DiscordSettingsSchema>;
export type WebsocketSettings = z.infer<typeof RemoteServerSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
