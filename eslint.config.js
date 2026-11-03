// Настройки ESLint для приложения (сервер и служебные скрипты проверяются своими тестами)
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'server/*', '.expo/*', 'legacy/*', 'artifact/*'] },
]);
