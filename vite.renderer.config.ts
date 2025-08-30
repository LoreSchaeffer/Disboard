import {defineConfig} from 'vite';
import {resolve} from 'path';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main_window: resolve(__dirname, 'pages/index.html'),
                button_settings: resolve(__dirname, 'pages/button_settings.html'),
                media_selector: resolve(__dirname, 'pages/media_selector.html'),
                settings: resolve(__dirname, 'pages/settings.html'),
                new_profile: resolve(__dirname, 'pages/new_profile.html'),
            }
        }
    }
});