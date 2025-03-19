import dedent from "dedent";
import type { Prefix } from "./interfaces";
import "uniformize";

export function generateName(prefix: Prefix, folder: string, cssVar = ""): Prefix {
	return {
		bg: `${cssVar}${prefix.bg}-${folder.unidecode()}`,
		color: `${cssVar}${prefix.color}-${folder.unidecode()}`,
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
		  border-bottom: 1px solid var(${variableNames.bg});
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
        description: Background
        format: hex
        opacity: true
        type: variable-themed-color
        title: ${folderName} Background
        default-light: "#ffffff00"
        default-dark: "#ffffff00"
    -
        id: ${variableNames.color}
        description: Font
        title: ${folderName} Font
        type: variable-themed-color
        format: hex
        default-light: "#ad8c33"
        default-dark: "#ad8c33"
        opacity: false
    
    ${dedent(remplaceTemplate(template, folderName, variableNames.bg, variableNames.color))}
    
    -`;
}
