import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',webServer:{command:'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:true},use:{baseURL:'http://127.0.0.1:5173',browserName:'chromium',channel:'msedge',headless:true},workers:1,reporter:'list'});
