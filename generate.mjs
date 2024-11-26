import c from "ansi-colors";
import ejs from "ejs";
import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import licenses from "spdx-license-list/full.js";
import { getLicense } from "license";
import packageJson from "./package.json" assert { type: "json" };
const { dim, reset } = c;
import { execa } from "execa";
import gitUserName from "git-user-name";
c.theme({
	danger: c.red,
	dark: c.dim.gray,
	disabled: c.gray,
	em: c.italic,
	heading: c.bold.underline,
	info: c.cyan,
	muted: c.dim,
	primary: c.blue,
	strong: c.bold,
	success: c.green.bold,
	underline: c.underline,
	warning: c.yellow.underline,
});

const capitalize = (s) => {
	if (typeof s !== "string") return "";
	return s.charAt(0).toUpperCase() + s.slice(1);
};
/**
 * Render ejs file
 * @param {fs.Dirent} file
 */
function ejsRender(file, data) {
	const pathFiles = path.join(file.path, file.name);
	const template = fs.readFileSync(pathFiles, { encoding: "utf-8" });
	const processedTemplate = ejs.render(template, { data });
	fs.writeFileSync(pathFiles, processedTemplate, { encoding: "utf-8" });
}

function updateManifest(data, answer) {
	const manifest = fs.readFileSync("./manifest.json", { encoding: "utf-8" });
	const processedManifest = ejs.render(manifest, { data });
	fs.writeFileSync("manifest.json", processedManifest, { encoding: "utf-8" });
	const license = getLicense(answer.license, {
		author: data.author.name,
		year: new Date().getFullYear(),
	});
	fs.writeFileSync("LICENSE", license, { encoding: "utf-8" });
	fs.writeFileSync("manifest-beta.json", processedManifest, {
		encoding: "utf-8",
	});
}
/**
 * Get package manager
 * @returns {"pnpm" | "yarn" | "npm" | "bun" | undefined}
 */
function getPackageManager() {
	if (fs.existsSync("yarn.lock")) return "yarn";
	if (fs.existsSync("pnpm-lock.yaml")) return "pnpm";
	if (fs.existsSync("package-lock.json")) return "npm";
	if (fs.existsSync("bun.lockb")) return "bun";
	return undefined;
}

function processReadme(data) {
	const readme = fs.readFileSync("./README.md", { encoding: "utf-8" });
	const processedReadme = ejs.render(readme, { data });
	fs.writeFileSync(
		"README.md",
		processedReadme.replace(
			"{{TEMPLATE_PLACEHOLDER LOCALE}}",
			"<% tp.obsidian.moment.locale() %>"
		),
		{ encoding: "utf-8" }
	);
}

function processCi(data) {
	const ci = fs.readFileSync("./.github/workflows/ci.yaml", {
		encoding: "utf-8",
	});
	const processedCi = ejs.render(ci, { data });
	fs.writeFileSync(".github/workflows/ci.yaml", processedCi, {
		encoding: "utf-8",
	});
}

function processBugReport(data) {
	const path = fs.readFileSync("./.github/ISSUE_TEMPLATE/bug.yml", {
		encoding: "utf-8",
	});
	const processedCi = ejs.render(path, { data });
	fs.writeFileSync("./.github/ISSUE_TEMPLATE/bug.yml", processedCi, {
		encoding: "utf-8",
	});
}

function updatePackageJson(data, answer) {
	packageJson.author = data.author.name;
	packageJson.name = data.id;
	packageJson.license = answer.license;
	packageJson.description = data.description;
	delete packageJson.scripts.generate;
	delete packageJson.devDependencies["@types/ejs"];
	delete packageJson.dependencies.ejs;
	delete packageJson.dependencies.prompts;
	delete packageJson.dependencies["spdx-license-list"];
	delete packageJson.dependencies.execa;
	delete packageJson.dependencies.license;
	delete packageJson.dependencies["git-user-name"];
	fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2), {
		encoding: "utf-8",
	});
}
/**
 * Install dep based on package manager detected (using lockfile)
 * @param {"pnpm" | "npm" | "yarn" | "bun" | undefined} packageManager
 */
async function updateDep(packageManager) {
	switch (packageManager) {
		case "yarn":
			console.log(c.info("Detected yarn, running yarn install"));
			//replace pnpm with yarn in package.json scripts
			fs.writeFileSync(
				"package.json",
				fs.readFileSync("package.json", "utf-8").replace("pnpm", "yarn"),
				"utf-8"
			);
			await execa("yarn", ["install"]);
			break;
		case "npm":
			console.log(c.info("Detected npm, running npm install"));
			fs.writeFileSync(
				"package.json",
				fs.readFileSync("package.json", "utf-8").replace("pnpm", "npm"),
				"utf-8"
			);
			await execa("npm", ["install"]);
			break;
		case "pnpm":
			console.log(c.info("Detected pnpm, running pnpm install"));
			await execa("pnpm", ["install"]);
			break;
		case "bun":
			console.log(c.info("Detected bun, running bun install"));
			await execa("bun", ["install"]);
			fs.writeFileSync(
				"package.json",
				fs.readFileSync("package.json", "utf-8").replace("pnpm", "bun"),
				"utf-8"
			);
			break;
		default:
			throw new Error("No package manager detected, please run yarn/npm/pnpm install");
	}
	console.log(c.success("✅ Installed dependencies"));
}

const defaultPluginID = process
	.cwd()
	.split(path.sep)
	.pop()
	.toLowerCase()
	.replaceAll(" ", "-")
	.replace(/-?obsidian-?/, "");

const answer = await prompts(
	[
		{
			type: () => "text",
			name: "id",
			message: `Enter the plugin ID ${reset("(lowercase, no spaces)")}`,
			initial: defaultPluginID,
			format: (value) => value.toLowerCase().replaceAll(" ", "-").toLowerCase(),
			validate: (value) => (value.length > 0 ? true : "Please enter a valid plugin ID"),
		},
		{
			type: "text",
			name: "name",
			message: "Enter the plugin name",
			initial: (prev) =>
				prev
					.replace("obsidian-plugin", "")
					.split("-")
					.filter((word) => word.length > 0)
					.map((word) => capitalize(word))
					.join(" "),
		},
		{
			type: "text",
			name: "description",
			message: "Enter the plugin description",
		},
		{
			type: "text",
			name: "author",
			message: "Enter the author name",
			initial: gitUserName(),
		},
		{
			type: "text",
			name: "authorUrl",
			message: "Enter the author URL",
			initial: (prev) => `https//github.com/${prev}`,
		},
		{
			type: "confirm",
			name: "desktopOnly",
			message: "Is this plugin desktop-only?",
			initial: false,
		},
		{
			type: "text",
			name: "fundingUrl",
			message: "Enter the funding URL",
		},
		{
			type: "autocomplete",
			name: "license",
			message: `Choose a license ${reset(dim("(type to filter, ↑ or ↓ to navigate)"))}`,
			initial: "MIT",
			choices: Object.entries(licenses).map(([id, license]) => {
				return {
					value: id,
					title: license.name,
					description: (license.osiApproved && "OSI Approved") || "",
				};
			}),
		},
	],
	{
		onCancel: () => {
			console.log(c.warning("❌ Generation cancelled"));
			process.exit(0);
		},
	}
);
/**
 * Readd recursive sync
 * @param {string} dir
 * @returns {fs.Dirent[]}
 */
function readdirRecursiveSync(dir) {
	const results = [];

	function readDirRecursive(currentPath) {
		const entries = fs.readdirSync(currentPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(currentPath, entry.name);
			if (entry.isDirectory()) {
				readDirRecursive(fullPath);
			} else {
				results.push(entry);
			}
		}
	}

	readDirRecursive(dir);
	return results;
}
const templateFiles = readdirRecursiveSync("./src");

const data = {
	name: answer.name || "Sample Plugin",
	id: answer.id || "sample-plugin",
	description: answer.description || "This is a sample plugin",
	interfaceName: answer.name.replaceAll(" ", "") || "SamplePlugin",
	author: {
		url: answer.authorUrl || "",
		name: answer.author || "Sample Author",
	},
	isDesktopOnly: !!answer.desktopOnly || false,
	packageManager: getPackageManager(),
};

if (answer.fundingUrl) {
	data.fundingUrl = answer.fundingUrl;
}

for (const file of templateFiles) {
	ejsRender(file, data);
}

updateManifest(data, answer);
processReadme(data);
processCi(data);
processBugReport(data);
console.log(c.success("✅ Generated ") + c.info("all files"));

//update package.json
updatePackageJson(data, answer);
//create hotreload file
fs.writeFileSync(".hotreload", "", { encoding: "utf-8" });

//detect if yarn or npm or pnpm
await updateDep(data.packageManager);

//delete this files
fs.unlinkSync("generate.mjs");
