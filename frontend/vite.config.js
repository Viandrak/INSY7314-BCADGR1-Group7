import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto';

export default defineConfig({
  plugins: [react(), subresourceIntegrity()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
})

function subresourceIntegrity() {
  return {
    name: 'subresource-integrity',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        const hashOf = (fileName) => {
          const file = ctx.bundle[fileName];
          if (!file) return null;
          const content = file.type === 'chunk' ? file.code : file.source;
          return `sha384-${createHash('sha384').update(content).digest('base64')}`;
        };

        return html.replace(/<(?:script|link)\b[^>]*>/g, (tag) => {
          if (tag.includes('integrity=')) return tag;
          const match = tag.match(/(?:src|href)="\/([^"]+\.(?:js|css))"/);
          if (!match) return tag;
          const integrity = hashOf(match[1]);
          if (!integrity) return tag;
          return tag.replace(/\s*\/?>$/, ` integrity="${integrity}">`);
        });
      },
    },
  };
}
