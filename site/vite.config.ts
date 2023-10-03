/*
 * Copyright (c) 2022-2023. Glowbuzzer. All rights reserved
 */

import react from "@vitejs/plugin-react"
import svgr from "@svgr/rollup"
import { defineConfig } from "vite"

export default defineConfig(() => ({
    server: {
        strictPort: true,
        port: 8089
    },
    plugins: [react(), svgr()],
    build: {
        outDir: "../build/gbpm"
    }
}))
