import dedent from "dedent";
import i18next from "i18next";
import { Notice, normalizePath, Plugin, sanitizeHTMLToDom, TFolder } from "obsidian";
import { merge } from "ts-deepmerge";
import { ColorCompiler } from "./compiler";
import { resources, translationLanguage } from "./i18n";
import { DEFAULT_SETTINGS, type SimpleColoredFolderSettings } from "./interfaces";
import { SimpleColoredFolderSettingTab } from "./settings";

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
					await this.compiler.injectDataPathFromFolder(file);
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
			await this.compiler.injectDataPath(folders);
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
		document.head.querySelector("#simple-colored-folder")?.remove();
		this.app.workspace.trigger("css-change");
	}
	async loadSettings() {
		const loadedData = await this.loadData();
		if (loadedData.timeout instanceof Number) delete loadedData.timeout;
		try {
			this.settings = merge(
				DEFAULT_SETTINGS,
				loadedData
			) as unknown as SimpleColoredFolderSettings;
		} catch (_e) {
			console.warn(
				"[Simple colored folder] Error while deep merging settings, using default loading method"
			);
			this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		}
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
