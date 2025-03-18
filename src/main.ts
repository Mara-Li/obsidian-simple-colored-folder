import i18next from "i18next";
import { Plugin, Notice, type TFolder } from "obsidian";
import { resources, translationLanguage } from "./i18n";

import { DEFAULT_SETTINGS, type SimpleColoredFolderSettings } from "./interfaces";
import { convertStyleSettings, convertToCSS, generateName } from "./template";
import dedent from "dedent";

export default class SimpleColoredFolder extends Plugin {
	settings!: SimpleColoredFolderSettings;
	style: HTMLStyleElement | null = null;

	createStyles(folders: TFolder[]) {
		let darkTheme = `.theme-dark {`;
		let lightTheme = `.theme-light {`;
		let css = "";
		let stylesSettings = dedent(`/* @settings
		name: ${this.manifest.name} • Colored Folder
		id: ${this.manifest.id}
		settings:
		    -`);
		for (const folder of folders) {
			const folderName = folder.name;
			const vn = generateName(this.settings.prefix, folderName, "--");
			darkTheme += dedent(`\n
				${vn.bg}: #ffffff00;
				${vn.color}: #ad8c33;
				`);
			lightTheme += dedent(`\n
			${vn.bg}: #ffffff00;
			${vn.color}: #ad8c33;`);
			css += convertToCSS(folderName, this.settings.prefix);
			stylesSettings += convertStyleSettings(folderName, this.settings.prefix);
		}
		darkTheme += "}";
		lightTheme += "}";
		stylesSettings = `${stylesSettings.replace(/-$/, "").trimEnd()}\n*/`;
		return `\n${stylesSettings}\n${darkTheme}\n${lightTheme}\n${css}`;
	}

	injectStyles() {
		const folders = this.app.vault
			.getAllFolders()
			.filter(
				(folder: TFolder) => folder.parent && folder.parent === this.app.vault.getRoot()
			);
		this.style = document.createElement("style");
		this.style.id = "simple-colored-folder";
		this.style.setAttribute("type", "text/css");
		this.style.textContent = this.createStyles(folders);
		document.head.appendChild(this.style);
		this.app.workspace.trigger("css-change");
		this.app.workspace.trigger("parse-style-settings");
	}

	async onload() {
		console.log(`[${this.manifest.name}] Loaded`);
		await this.loadSettings();
		//load i18next
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
			returnEmptyString: false,
		});

		const styleSettings = this.app.plugins.getPlugin("obsidian-style-settings");
		if (!styleSettings) {
			new Notice("Please enable 'Style Settings' plugin");
			return;
		}

		this.injectStyles();
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
		this.style?.detach();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
