import dedent from "dedent";
import { DEFAULT_COLOR, type Prefix } from "./interfaces";
import "uniformize";
import i18next from "i18next";

function standardize(str: string) {
	return str.standardize().replace(/\s/g, "").replaceAll(".", "");
}

export function generateName(prefix: Prefix, folder: string, cssVar = ""): Prefix {
	return {
		bg: `${cssVar}${prefix.bg}-${standardize(folder)}`,
		color: `${cssVar}${prefix.color}-${standardize(folder)}`,
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
	
		.nav-files-container.node-insert-event>div>.tree-item.nav-folder>.tree-item-self.nav-folder-title[data-path="${folderName}"] {
		  border-bottom: 1px solid var(${variableNames.color});
		  border-radius: 0;
		}
		
		.nav-files-container.node-insert-event>div>.tree-item.nav-folder.is-collapsed>.tree-item-self.nav-folder-title[data-path="${folderName}"] {
		  border-bottom: 0;
		}
		
		.tree-item.nav-folder:has([data-path="${folderName}"]) {
		  background-color: var(${variableNames.bg}) !important;
		  border-radius: var(--FolderRadius);
		  --nav-indentation-guide-color: var(${variableNames.color}) !important;
		}

		.theme-light .nav-file-title[class*="is-active"][data-path^="${folderName}"],
		.theme-dark .nav-file-title[class*="is-active"][data-path^="${folderName}"],
		.theme-dark .nav-folder-title[data-path^="${folderName}"]:hover,
		.theme-light .nav-folder-title[data-path^="${folderName}"]:hover,
		.theme-dark .nav-file-title[data-path^="${folderName}"]:hover,
		.theme-light .nav-file-title[data-path^="${folderName}"]:hover,
		.theme-light .nav-folder-title[class*="is-active"][data-path^="${folderName}"],
		.theme-dark .nav-folder-title[class*="is-active"][data-path^="${folderName}"] {
		  color: var(${variableNames.color}) !important;
		  background-color: var(${variableNames.bg}) !important;
		  filter: saturate(150%);
		}
		
		${dedent(remplaceTemplate(template, folderName, variableNames.bg, variableNames.color))}

		
		`);
}

export function convertStyleSettings(
	folderName: string,
	prefix: Prefix,
	template: string
) {
	const variableNames = generateName(prefix, folderName);
	return `
        type: heading
        level: 3
        collapsed: true
        title: ${folderName}
    -
        id: ${variableNames.bg}
        description: ${i18next.t("common.background")}
        format: hex
        opacity: true
        type: variable-themed-color
        title: ${folderName} ${i18next.t("common.background")}
        default-light: "${DEFAULT_COLOR}"
        default-dark: "${DEFAULT_COLOR}"
    -
        id: ${variableNames.color}
        description: ${i18next.t("common.color")}
        title: ${folderName} ${i18next.t("common.color")}
        type: variable-themed-color
        format: hex
        default-light: "${DEFAULT_COLOR}"
        default-dark: "${DEFAULT_COLOR}"
        opacity: false
    
    ${dedent(remplaceTemplate(template, folderName, variableNames.bg, variableNames.color))}
    
    -`;
}

export function themes(vn: Prefix) {
	return dedent(`\n
				${vn.bg}: "${DEFAULT_COLOR}";
				${vn.color}: var(--nav-item-color);
	`);
}
