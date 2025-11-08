import dedent from "dedent";
import {
	type Colors,
	DEFAULT_COLOR,
	type Prefix,
	type SimpleColoredFolderSettings,
} from "../interfaces";
import "uniformize";
import i18next from "i18next";
import type { PluginManifest, TFolder } from "obsidian";
import { formatCss, removeExtraNewLine, standardize } from ".";

export function generateName(prefix: Prefix, folder: string, cssVar = ""): Prefix {
	return {
		bg: `${cssVar}${prefix.bg}-${standardize(folder).replace(/[^a-zA-Z0-9_-]/g, "")}`,
		color: `${cssVar}${prefix.color}-${standardize(folder).replace(/[^a-zA-Z0-9_-]/g, "")}`,
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

export function styleSettingsHeader(manifest: PluginManifest) {
	return dedent(`
		/* @settings
		name: ${manifest.name}
		id: ${manifest.id}
		settings:
      -
          id: spf-FolderRadius
          type: variable-number
          title: ${i18next.t("common.radius")}
          description: "Format: px"
          default: 5
          format: px
      -
          id: spf-space-between
          type: variable-number
          default: 0.3
          format: em
          description: "Format: em"
          title: ${i18next.t("common.space")}
      -
          id: spf-saturate
          type: variable-number
          default: 500
          title: ${i18next.t("common.saturate")}
          format: "%"
          description: "Format: %"
      -
          id: spf-saturate-hover
          default: 150
          type: variable-number
          format: "%"
          title: ${i18next.t("common.saturateHover")}
          description: "Format: %"
      -`);
}

export function createStyles(
	folders: TFolder[],
	manifest: PluginManifest,
	settings: SimpleColoredFolderSettings,
	minify?: boolean
) {
	let darkTheme = `.theme-dark {`;
	let lightTheme = `.theme-light {`;
	let css = "";
	let stylesSettings = styleSettingsHeader(manifest);
	for (const folder of folders) {
		const folderName = folder.name;
		const vn = generateName(settings.prefix, folderName, "--");
		darkTheme += themes(vn, settings.defaultColors, "themeDark");
		lightTheme += themes(vn, settings.defaultColors, "themeLight");
		css += convertToCSS(folderName, settings.prefix, settings.customTemplate);
		stylesSettings += convertStyleSettings(
			folderName,
			settings.prefix,
			settings.customStyleSettings,
			settings.defaultColors
		);
	}
	darkTheme += "}";
	lightTheme += "}";
	stylesSettings = `${stylesSettings.replace(/-+$/, "").trimEnd()}\n*/`;
	return `\n${removeExtraNewLine(stylesSettings)}\n${formatCss(darkTheme, minify)}\n${formatCss(lightTheme, minify)}\n${formatCss(css, minify)}`;
}
