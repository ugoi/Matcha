/// <reference types="vitest" />
import { config } from 'dotenv'
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    // ... Specify options here.
    env: {
        ...config({ path: "./.env.test" }).parsed,
      },
  },
})
