export type Prefix = {
	bg: string;
	color: string;
};

export interface SimpleColoredFolderSettings {
	prefix: Prefix;
	customTemplate: string;
	customStyleSettings: string;
}

export const DEFAULT_SETTINGS: SimpleColoredFolderSettings = {
	prefix: {
		bg: "bg",
		color: "col",
	},
	customTemplate: "",
	customStyleSettings: "",
};
