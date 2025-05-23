import * as fs from "fs";
import * as path from "path";
import builtins from "builtin-modules";
import { Command } from "commander";
import dotenv from "dotenv";
import esbuild from "esbuild";
import manifest from "./manifest.json" with { type: "json" };
import packageJson from "./package.json" with { type: "json" };

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin: ${packageJson.repository}
*/
`;

function cleanOutDir(outdir) {
	if (fs.existsSync(outdir)) {
		fs.rm(outdir, { recursive: true });
	}
}

/**
 * @typedef Options
 * @prop {boolean|undefined} production
 * @prop {string|boolean|undefined} vault
 * @prop {string|undefined} outputDir
 * @prop {boolean|undefined} beta
 */

dotenv.config({ path: [".env"] });

const program = new Command();
program
	.option("-p, --production", "Production build")
	.option("-v, --vault [vault]", "Use vault path", false)
	.option("-o, --output-dir <path>", "Output path")
	.option("-b, --beta", "Pre-release version")
	.parse();
program.parse();

/** OPTIONS */
/** @type {Options} */
const opt = program.opts();
/** @type {boolean} */
const prod = opt.production ?? false;

/** VARIABLES **/
const isStyled = fs.existsSync("src/styles.css");
const pluginID = manifest.id;

function getVaultPath(value) {
	if (typeof value === "string") return value;
	if (value === true) {
		const vaultPath = process.env.VAULT;
		if (!vaultPath) {
			throw new Error("VAULT environment variable not set");
		}
		return vaultPath;
	}
	return false;
}
/** FOLDER PATHS **/
const folderPlugin = opt.vault
	? path.join(getVaultPath(opt.vault), ".obsidian", "plugins", pluginID)
	: undefined;

if (folderPlugin && !fs.existsSync(folderPlugin)) {
	fs.mkdirSync(folderPlugin, { recursive: true });
}
if (opt.beta && !fs.existsSync("manifest-beta.json")) {
	fs.copyFileSync("manifest.json", "manifest-beta.json");
}

let outDir = "./";
if (opt.outputDir) {
	outDir = opt.outputDir;
	cleanOutDir(outDir);
} else if (opt.vault) {
	outDir = folderPlugin;
	if (!prod) fs.writeFileSync(path.join(folderPlugin, ".hotreload"), "");
} else if (prod) {
	outDir = "./dist";
	//clean dist if
	cleanOutDir(outDir);
}

/**
 * Move styles.css to output directory
 */
const moveStyles = {
	name: "move-styles",
	setup(build) {
		build.onEnd(() => {
			fs.copyFileSync("src/styles.css", "./styles.css");
		});
	},
};

/**
 * Export to vault if set in environment variable
 */
const exportToVaultFunc = {
	name: "export-to-vault",
	setup(build) {
		build.onEnd(() => {
			if (!folderPlugin)
				throw new Error("VAULT environment variable not set, skipping export to vault");

			fs.copyFileSync(`${outDir}/main.js`, path.join(folderPlugin, "main.js"));
			if (fs.existsSync(`${outDir}/styles.css`))
				fs.copyFileSync("./styles.css", path.join(folderPlugin, "styles.css"));
			if (opt.beta)
				fs.copyFileSync("manifest-beta.json", path.join(folderPlugin, "manifest.json"));
			else fs.copyFileSync("./manifest.json", path.join(folderPlugin, "manifest.json"));
		});
	},
};

/**
 * Export to production folder
 */
const exportToDist = {
	name: "export-to-dist",
	setup(build) {
		build.onEnd(() => {
			if (opt.beta)
				fs.copyFileSync("manifest-beta.json", path.join(outDir, "manifest.json"));
			else fs.copyFileSync("manifest.json", path.join(outDir, "manifest.json"));
		});
	},
};

/**
 * ENTRIES *
 */
const entryPoints = ["src/main.ts"];
if (isStyled) entryPoints.push("src/styles.css");

/** PLUGINS **/
const plugins = [];
if (isStyled) plugins.push(moveStyles);
if (prod) plugins.push(exportToDist);
if (opt.vault) plugins.push(exportToVaultFunc);

/**
 * BUILD
 */
const context = await esbuild.context({
	banner: {
		js: banner,
	},
	entryPoints,
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "esnext",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	minifySyntax: prod,
	minifyWhitespace: prod,
	outdir: outDir,
	plugins,
	minify: prod,
});

if (prod) {
	console.log("🎉 Build for production");
	console.log(`📤 Output directory: ${outDir}`);
	await context.rebuild();
	console.log("✅ Build successful");
	process.exit(0);
} else {
	console.log("🚀 Start development build");
	console.log(`📤 Output directory: ${outDir}`);
	await context.watch();
}
