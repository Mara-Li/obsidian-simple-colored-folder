export type Prefix = {
	bg: string;
	color: string;
};

export const DEFAULT_COLOR = "#ffffff00";

export interface SimpleColoredFolderSettings {
	prefix: Prefix;
	customTemplate: string;
	customStyleSettings: string;
	exportToCSS: boolean;
}

export const DEFAULT_SETTINGS: SimpleColoredFolderSettings = {
	prefix: {
		bg: "bg",
		color: "col",
	},
	customTemplate: "",
	customStyleSettings: "",
	exportToCSS:false,
};

export type StyleSettingValue = number | string | boolean;
