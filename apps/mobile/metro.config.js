const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Observa o monorepo inteiro para módulos hoistados
config.watchFolders = [monorepoRoot];

// Resolve módulos: primeiro local, depois raiz do monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Garante que o entry point do expo-router seja encontrado na raiz do monorepo
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
