import {resolve} from 'path';
import {defineConfig} from 'electron-vite';
// eslint-disable-next-line import/no-unresolved
import react from '@vitejs/plugin-react';

export default defineConfig({
    main: {
        build: {
            lib: {
                entry: resolve(__dirname, 'src/main.ts')
            }
        }
    },
    preload: {
        build: {
            lib: {
                entry: resolve(__dirname, 'src/preload.ts')
            }
        }
    },
    renderer: {
        root: '.',
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'index.html')
                }
            }
        },
        plugins: [react()]
    }
});