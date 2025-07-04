import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

export default defineConfig({
  plugins: [pluginVue()],
  server: {
    port: 8098
  },
  html:{
    title:"管网编辑Demo"
  },
  output:{
    assetPrefix:"/gas-pipeline-edit-demo/"
  }
});
