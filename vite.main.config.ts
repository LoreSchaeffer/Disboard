import {defineConfig} from 'vite';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        rollupOptions: {
            external: [
                '@ffmpeg-installer/ffmpeg',
                '@ffprobe-installer/ffprobe',
                'fluent-ffmpeg',
                'electron-squirrel-startup',
                'discord.js',
                '@discordjs/voice',
                'libsodium-wrappers',
                'sodium-native',
                '@snazzah/davey',
                'zod',
            ],
        }
    }
});
