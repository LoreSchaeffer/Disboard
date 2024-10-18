import {defineConfig} from 'vite';
import {resolve} from 'path';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main_window: resolve(__dirname, 'index.html'),
                button_settings: resolve(__dirname, 'button_settings.html'),
                media_selector: resolve(__dirname, 'media_selector.html'),
                settings: resolve(__dirname, 'settings.html'),
                new_profile: resolve(__dirname, 'new_profile.html'),
            }
        }
    }
});
