import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueTs from '@vue/eslint-config-typescript'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'supabase/.temp/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...vueTs({ supportedScriptLangs: { ts: true, tsx: false, js: true, jsx: false } }),
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The MFA setup dialog renders Supabase's generated QR SVG (not user input).
    files: ['src/pages/settings/SecuritySettings.vue'],
    rules: { 'vue/no-v-html': 'off' },
  },
]
