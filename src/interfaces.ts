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
	defaultColors: Colors;
}

export type ThemedColors = {
	themeDark: string;
	themeLight: string;
};

export type Colors = {
	bg: ThemedColors;
	color: ThemedColors;
};

export const DEFAULT_THEMED_COLORS = {
	themeDark: DEFAULT_COLOR,
	themeLight: DEFAULT_COLOR,
};

export const DEFAULT_COLORS: Colors = {
	bg: DEFAULT_THEMED_COLORS,
	color: DEFAULT_THEMED_COLORS,
};

export const DEFAULT_SETTINGS: SimpleColoredFolderSettings = {
	prefix: {
		bg: "bg",
		color: "col",
	},
	customTemplate: "",
	customStyleSettings: "",
	exportToCSS: false,
	defaultColors: DEFAULT_COLORS,
};

export type StyleSettingValue = number | string | boolean;
