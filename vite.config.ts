import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
        projects: path.resolve(__dirname, "projects.html"),
        certificates: path.resolve(__dirname, "certificates.html"),
        education: path.resolve(__dirname, "education.html"),
        contact: path.resolve(__dirname, "contact.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
