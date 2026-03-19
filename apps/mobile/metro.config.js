const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Inclui a pasta raiz do monorepo no watch para que os módulos hoistados sejam encontrados
config.watchFolders = [monorepoRoot];

// Ordem de resolução: primeiro local, depois raiz do monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
