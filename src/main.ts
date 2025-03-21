import i18next from "i18next";
import { Plugin, Notice, TFolder, type TAbstractFile, sanitizeHTMLToDom } from "obsidian";
import { resources, translationLanguage } from "./i18n";

import {
	DEFAULT_SETTINGS,
	type Prefix,
	type SimpleColoredFolderSettings,
	type StyleSettingValue,
} from "./interfaces";
import { convertStyleSettings, convertToCSS, generateName, themes } from "./template";
import dedent from "dedent";
import { SimpleColoredFolderSettingTab } from "./settings";
import { minifyCss, removeExtraNewLine } from "./utils";

export default class SimpleColoredFolder extends Plugin {
	settings!: SimpleColoredFolderSettings;
	style: HTMLStyleElement | null = null;

	styleSettingsHeader() {
		return dedent(`
		/* @settings
		name: ${this.manifest.name}
		id: ${this.manifest.id}
		settings:
      -
          id: FolderRadius
          type: variable-number-slider
          title: ${i18next.t("common.radius")}
          default: 5
          min: 0
          max: 20
          step: 1
          format: px
      -
          id: space-between
          type: variable-number-slider
          default: 0.3
          max: 5
          step: 0.1
          min: 0
          format: em
          title: ${i18next.t("common.space")}
      -`);
	}

	createStyles(folders: TFolder[]) {
		let darkTheme = `.theme-dark {`;
		let lightTheme = `.theme-light {`;
		let css = "";
		let stylesSettings = this.styleSettingsHeader();
		for (const folder of folders) {
			const folderName = folder.name;
			const vn = generateName(this.settings.prefix, folderName, "--");
			darkTheme += themes(vn);
			lightTheme += themes(vn);
			css += convertToCSS(folderName, this.settings.prefix, this.settings.customTemplate);
			stylesSettings += convertStyleSettings(
				folderName,
				this.settings.prefix,
				this.settings.customStyleSettings
			);
		}
		darkTheme += "}";
		lightTheme += "}";
		stylesSettings = `${stylesSettings.replace(/-+$/, "").trimEnd()}\n*/`;
		return `\n${removeExtraNewLine(stylesSettings)}\n${minifyCss(darkTheme)}\n${minifyCss(lightTheme)}\n${minifyCss(css)}`;
	}

	injectStyles(reload = true) {
		const folders = this.app.vault
			.getAllFolders()
			.filter(
				(folder: TFolder) => folder.parent && folder.parent === this.app.vault.getRoot()
			);
		this.style?.detach();
		this.style = document.createElement("style");
		this.style.id = "simple-colored-folder";
		this.style.setAttribute("type", "text/css");
		this.style.textContent = this.createStyles(folders);
		document.head.appendChild(this.style);
		if (reload) this.reload();
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
			new Notice(
				sanitizeHTMLToDom(
					dedent`<span class="spf-warning">${i18next.t("warning")}</span>`
				)
			);
		}

		this.injectStyles();
		this.app.workspace.trigger("parse-style-settings");
		this.addSettingTab(new SimpleColoredFolderSettingTab(this.app, this));

		this.app.vault.on("rename", async (file, oldPath) => {
			await this.renameCss(file, oldPath);
		});

		this.app.vault.on("create", (file) => {
			this.injectToRoot(file);
		});
	}

	async renameCss(newPath: TAbstractFile, oldPath: string) {
		const styleSettingPlugin = this.app.plugins.getPlugin("obsidian-style-settings");
		if (!styleSettingPlugin) return;
		if (newPath instanceof TFolder && newPath.parent === this.app.vault.getRoot()) {
			const settings = (await styleSettingPlugin.loadData()) as Record<
				string,
				StyleSettingValue
			>;
			const oldNames = generateName(this.settings.prefix, oldPath);
			const generateKeys = (prefix: Prefix) => {
				return {
					bg: {
						light: `${this.manifest.id}@@${prefix.bg}@@light`,
						dark: `${this.manifest.id}@@${prefix.bg}@@dark`,
					},
					color: {
						light: `${this.manifest.id}@@${prefix.color}@@light`,
						dark: `${this.manifest.id}@@${prefix.color}@@dark`,
					},
				};
			};

			const oldKeys = generateKeys(oldNames);
			const newKeys = generateKeys(generateName(this.settings.prefix, newPath.name));

			const styleSettingsValues: Record<string, StyleSettingValue | undefined> = {
				[newKeys.bg.light]: settings?.[oldKeys.bg.light],
				[newKeys.bg.dark]: settings?.[oldKeys.bg.dark],
				[newKeys.color.light]: settings?.[oldKeys.color.light],
				[newKeys.color.dark]: settings?.[oldKeys.color.dark],
			};
			//if every key is undefined => no need to re-apply the theming, just return
			if (
				!Object.values(styleSettingsValues).some(
					(value) => value !== undefined && value !== ""
				)
			)
				return this.injectStyles();
			this.injectStyles();
			//@ts-ignore
			styleSettingPlugin.settingsManager.setSettings(styleSettingsValues);
		}
	}

	injectToRoot(file: TAbstractFile) {
		if (file instanceof TFolder && file.parent === this.app.vault.getRoot())
			this.injectStyles();
	}

	reload() {
		this.app.workspace.trigger("css-change");
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
		//remove the style
		this.style?.detach();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
