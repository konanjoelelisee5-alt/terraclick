import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En développement et en prévisualisation, /api est relayé vers Laravel :
// le navigateur reste sur une seule origine, sans réglage CORS.
const API = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": API } },
  preview: { proxy: { "/api": API } },
});
