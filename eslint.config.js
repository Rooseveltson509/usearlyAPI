import globals from "globals";
import pluginJs from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      ecmaVersion: "latest", // Support des dernières versions de JavaScript
      sourceType: "module", // Utilisation des modules ECMAScript
      globals: {
        ...globals.browser, // Inclure les globals pour les navigateurs
        ...globals.node, // Inclure les globals pour Node.js
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "no-console": "off", // Autorise console.log et autres
      "no-unused-vars": ["error", { argsIgnorePattern: "^err$" }],
      "no-undef": "off", // Désactiver l'erreur pour les globals comme process
      "semi": ["error", "always"], // Obligatoire d'ajouter un ;
      "quotes": ["error", "double"], // Utilisation des doubles quotes partout
      "prettier/prettier": [
        "error",
        {
          singleQuote: false, // Préférer des doubles quotes
          jsxSingleQuote: false, // Doubles quotes dans JSX
          quoteProps: "consistent", // Harmoniser les propriétés
        },
      ],
    },
  },
  pluginJs.configs.recommended, // Inclure les configurations recommandées par ESLint
  prettierConfig,
];
