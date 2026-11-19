// apps/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar también los archivos de la raíz del monorepo
config.watchFolders = [workspaceRoot];

// 2. Buscar node_modules primero en la app, luego en la raíz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. No subir buscando módulos fuera de estas rutas
config.resolver.disableHierarchicalLookup = true;

module.exports = config;