"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var vite_plugin_shadcn_theme_json_1 = require("@replit/vite-plugin-shadcn-theme-json");
var path_1 = require("path");
var vite_plugin_runtime_error_modal_1 = require("@replit/vite-plugin-runtime-error-modal");
exports.default = (0, vite_1.defineConfig)({
    plugins: __spreadArray([
        (0, plugin_react_1.default)(),
        (0, vite_plugin_runtime_error_modal_1.default)(),
        (0, vite_plugin_shadcn_theme_json_1.default)()
    ], (process.env.NODE_ENV !== "production" &&
        process.env.REPL_ID !== undefined
        ? [
            await Promise.resolve().then(function () { return require("@replit/vite-plugin-cartographer"); }).then(function (m) {
                return m.cartographer();
            }),
        ]
        : []), true),
    resolve: {
        alias: {
            "@": path_1.default.resolve(import.meta.dirname, "client", "src"),
            "@shared": path_1.default.resolve(import.meta.dirname, "shared"),
            "@assets": path_1.default.resolve(import.meta.dirname, "attached_assets"),
        },
    },
    root: path_1.default.resolve(import.meta.dirname, "client"),
    build: {
        outDir: path_1.default.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true,
    },
});
