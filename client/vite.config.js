import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The static-assets folder is committed as "Public" (capital P). Vite only
  // looks for "public" by default, which works on Windows but 404s on Linux.
  publicDir: "Public",
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
