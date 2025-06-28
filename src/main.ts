import i18next from "i18next";
import { Plugin, Notice, sanitizeHTMLToDom, normalizePath, TFolder } from "obsidian";
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
				if (file instanceof TFolder && file.parent === this.app.vault.getRoot())
					this.compiler.injectDataPathFromFolder(file);
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", async () => {
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
			const folders = this.compiler.getFolder();
			this.compiler.injectDataPath(folders);
			await this.compiler.injectStyles(true, folders);
			this.app.vault.on("create", async (file) => {
				await this.compiler.injectToRoot(file);
				if (file instanceof TFolder && file.parent === this.app.vault.getRoot()) {
					await this.compiler.injectDataPathFromFolder(file);
				}
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
