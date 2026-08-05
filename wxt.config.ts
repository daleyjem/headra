import { defineConfig } from "wxt";
import svgr from "vite-plugin-svgr";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifestVersion: 3,
  srcDir: "src",
  outDir: "build",
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [svgr({ svgrOptions: { exportType: "default" } })],
  }),
  manifest: {
    permissions: ["storage", "declarativeNetRequest"],
    host_permissions: ["<all_urls>"],
    browser_specific_settings: {
      gecko: {
        id: "headra@daleyjem.com",
      },
    },
  },
  webExt: {
    disabled: process.env.NO_BROWSER === "true",
  },
});
