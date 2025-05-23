import i18next from "i18next";
import { Plugin, Notice, sanitizeHTMLToDom, normalizePath } from "obsidian";
import { resources, translationLanguage } from "./i18n";

import { DEFAULT_SETTINGS, type SimpleColoredFolderSettings } from "./interfaces";
import dedent from "dedent";
import { SimpleColoredFolderSettingTab } from "./settings";
import { ColorCompiler } from "./compiler";

export default class SimpleColoredFolder extends Plugin {
	settings!: SimpleColoredFolderSettings;
	style: HTMLStyleElement | null = null;
	snippetPath: string = "generated.colored-folder.css";
	compiler!: ColorCompiler;

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
		this.snippetPath = normalizePath(
			`${this.app.vault.configDir}/snippets/generated.colored-folder.css`
		);
		this.compiler = new ColorCompiler(this);
		this.style = this.compiler.style;

		this.addSettingTab(new SimpleColoredFolderSettingTab(this.app, this));
		this.registerEvent(
			this.app.vault.on("rename", async (file, oldPath) => {
				await this.compiler.renameCss(file, oldPath);
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", async (file) => {
				await this.compiler.injectStyles();
			})
		);

		this.app.workspace.onLayoutReady(async () => {
			const styleSettings = this.app.plugins.getPlugin("obsidian-style-settings");
			if (!styleSettings?._loaded) {
				new Notice(
					sanitizeHTMLToDom(
						dedent`<span class="spf-warning">${i18next.t("warning")}</span>`
					)
				);
			}
			await this.compiler.injectStyles(true);
			this.app.vault.on("create", async (file) => {
				await this.compiler.injectToRoot(file);
			});
		});
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
		//remove the style
		this.compiler.style?.detach();
		this.compiler.style?.remove();
		this.app.workspace.trigger("css-change");
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
