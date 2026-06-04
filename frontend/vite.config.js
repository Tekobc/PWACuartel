import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // El SW debe estar en la raíz del sitio para tener scope completo.
  // Copiamos sw.js y manifest.json desde public/ automáticamente.
  // Asegurate de poner sw.js y manifest.json en frontend/public/
  publicDir: 'public',
});
