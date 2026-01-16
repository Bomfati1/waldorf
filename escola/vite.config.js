import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Configurações adicionais para melhor compatibilidade
    cors: true,
    strictPort: false,
  },
  // Configurar PostCSS inline
  css: {
    postcss: {
      plugins: [
        autoprefixer({
          overrideBrowserslist: [
            "> 1%",
            "last 2 versions",
            "not dead",
            "Safari >= 9",
            "iOS >= 9",
            "Chrome >= 60",
            "Firefox >= 60",
            "Edge >= 15",
          ],
        }),
      ],
    },
    devSourcemap: true,
  },
  // Otimizações de build
  build: {
    // Garantir que JSX seja processado corretamente
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Melhorar compatibilidade com navegadores mais antigos
    target: "es2015",
    cssCodeSplit: true,
    sourcemap: false,
  },
  // Configurar resolução de módulos
  resolve: {
    extensions: [".mjs", ".js", ".jsx", ".json", ".ts", ".tsx"],
  },
  // Otimizar dependências
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".jsx": "jsx",
      },
    },
  },
});
