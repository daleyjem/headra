import { defineConfig } from "wxt";
import svgr from "vite-plugin-svgr";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [svgr({ svgrOptions: { exportType: "default" } })],
  }),
  manifest: {
    version: "1.0.0",
    description: "Modify HTTP request and response headers.",
    name: "Headra",
    permissions: ["storage", "declarativeNetRequest"],
    host_permissions: ["<all_urls>"],
  },
  webExt: {
    disabled: process.env.NO_BROWSER === "true",
  },
});
