import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    base: '/digital-echoes/',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                artwork1: resolve(__dirname, 'artworks/1.html'),
                artwork2: resolve(__dirname, 'artworks/2.html'),
                artwork3: resolve(__dirname, 'artworks/3.html'),
            },
        },
    },
})


