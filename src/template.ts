import dedent from "dedent";
import {
	type Colors,
	DEFAULT_COLOR,
	type Prefix,
	type SimpleColoredFolderSettings,
} from "./interfaces";
import "uniformize";
import i18next from "i18next";
import { generateRandomColor, standardize } from "./utils";

export function generateName(prefix: Prefix, folder: string, cssVar = ""): Prefix {
	return {
		bg: `${cssVar}${prefix.bg}-${standardize(folder).replace(/[^a-zA-Z0-9_-]/, "")}`,
		color: `${cssVar}${prefix.color}-${standardize(folder).replace(/[^a-zA-Z0-9_-]/, "")}`,
	};
}

function remplaceTemplate(
	template: string,
	folderName: string,
	bg: string,
	color: string
) {
	return template
		.replace(/\${folderName}/g, folderName)
		.replace(/\${bg}/g, bg)
		.replace(/\${color}/g, color);
}

export function convertToCSS(folderName: string, prefix: Prefix, template: string) {
	const variableNames = generateName(prefix, folderName, "--");
	return dedent(`
	/* ---- ${folderName} ---- */
		.nav-folder-title[data-path^="${folderName}"],
		.nav-file-title[data-path^="${folderName}"] {
		  color: var(${variableNames.color}) !important;
		}
		
		.tree-item.nav-folder[data-path="${folderName}"] {
		  background-color: var(${variableNames.bg}) !important;
		  border-radius: var(--spf-FolderRadius);
		}

		.nav-file-title[class*="is-active"][data-path^="${folderName}"],
		.nav-folder-title[data-path^="${folderName}"]:hover,
		.nav-file-title[data-path^="${folderName}"]:hover,
		.nav-folder-title[class*="is-active"][data-path^="${folderName}"] {
		  color: var(${variableNames.color}) !important;
		  background-color: var(${variableNames.bg}) !important;
		  filter: saturate(var(--spf-saturate-hover));
		}
		
		${dedent(remplaceTemplate(template, folderName, variableNames.bg, variableNames.color))}

	`);
}

export function convertStyleSettings(
	folderName: string,
	prefix: Prefix,
	template: string,
	defaultColor: Colors
) {
	const variableNames = generateName(prefix, folderName);
	return `
        type: heading
        level: 3
        collapsed: true
        title: "${folderName}"
    -
        id: ${variableNames.bg}
        format: hex
        opacity: true
        type: variable-themed-color
        title: "${i18next.t("common.background")}"
        default-light: "${defaultColor.bg.themeLight}"
        default-dark: "${defaultColor.bg.themeDark}"
    -
        id: ${variableNames.color}
        title: ${i18next.t("common.color")}
        type: variable-themed-color
        format: hex
        default-light: "${defaultColor.color.themeLight}"
        default-dark: "${defaultColor.color.themeDark}"
        opacity: true
    
    ${dedent(remplaceTemplate(template, folderName, variableNames.bg, variableNames.color))}
    
    -`;
}

export function themes(
	vn: Prefix,
	defaultColor: Colors,
	theme: "themeLight" | "themeDark"
) {
	const color =
		defaultColor.color[theme] === DEFAULT_COLOR
			? '"var(--nav-item-color)"'
			: `${defaultColor.color[theme]}`;
	return dedent(`\n
				${vn.bg}: ${defaultColor.bg[theme]};
				${vn.color}: ${color};
	`);
}

export function defaultColors(settings: SimpleColoredFolderSettings) {
	return {
		bg: {
			themeDark: generateRandomColor(settings.alpha.bg),
			themeLight: generateRandomColor(settings.alpha.bg),
		},
		color: {
			themeDark: generateRandomColor(settings.alpha.color),
			themeLight: generateRandomColor(settings.alpha.color),
		},
	};
}
