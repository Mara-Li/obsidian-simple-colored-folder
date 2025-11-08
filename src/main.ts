import dedent from "dedent";
import i18next from "i18next";
import { Notice, normalizePath, Plugin, sanitizeHTMLToDom, TFolder } from "obsidian";
import type { FileExplorerView } from "obsidian-typings";
import { merge } from "ts-deepmerge";
import type { ColorGetter } from "./getter";
import { resources, translationLanguage } from "./i18n";
import { ColorInjector } from "./injector";
import { DEFAULT_SETTINGS, type SimpleColoredFolderSettings } from "./interfaces";
import { SimpleColoredFolderSettingTab } from "./settings";

export default class SimpleColoredFolder extends Plugin {
	settings!: SimpleColoredFolderSettings;
	style: HTMLStyleElement | null = null;
	snippetPath: string = "generated.colored-folder.css";
	inject!: ColorInjector;
	getter!: ColorGetter;

	async onload() {
		console.log(`[${this.manifest.name}] Loaded`);
		await this.loadSettings();
		await this.migrateSettings();
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

		this.inject = new ColorInjector(this);
		this.getter = this.inject.getter;
		this.style = this.inject.style;

		this.addSettingTab(new SimpleColoredFolderSettingTab(this.app, this));
		this.registerEvent(
			this.app.vault.on("rename", async (file, oldPath) => {
				await this.inject.renameCss(file, oldPath);
				if (file instanceof TFolder && file.parent === this.app.vault.getRoot())
					await this.getter.injectDataPathFromFolder(file);
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", async () => {
				await this.inject.styles();
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
			const folders = this.getter.getFolderAtRoot();
			// Run data-path injection and style injection in parallel. Use allSettled so one
			// failing task doesn't prevent the other from completing; we log failures.
			// noinspection ES6MissingAwait
			const tasks = [this.inject.dataPath(folders), this.inject.styles(true, folders)];
			const results = await Promise.allSettled(tasks);
			results.forEach((r, i) => {
				if (r.status === "rejected") {
					console.warn(`startup task ${i} failed`, r.reason);
				}
			});
			this.app.vault.on("create", async (file) => {
				await this.inject.toRoot(file);
				if (file instanceof TFolder && file.parent === this.app.vault.getRoot()) {
					await this.getter.injectDataPathFromFolder(file);
				}
			});
		});
		this.registerEvent(
			this.app.workspace.on("layout-change", async () => {
				//only if the layout opened is the file explorer
				const navigation = this.app.workspace.getLeavesOfType("file-explorer");
				if (!navigation.length || !navigation.first()?.isVisible()) return;
				const fileExplorer = navigation.first()?.view as FileExplorerView;
				if (!fileExplorer) return;
				const folders = this.getter.getFolderAtRoot();
				await this.inject.dataPath(folders, fileExplorer);
			})
		);
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
		//remove the style
		this.inject.style?.detach();
		this.inject.style?.remove();
		document.head.querySelector("#simple-colored-folder")?.remove();
		this.app.workspace.trigger("css-change");
	}
	async loadSettings() {
		const loadedData = await this.loadData();
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

	async migrateSettings() {
		if ("timeout" in this.settings) {
			console.warn("[Simple colored folder] Migrating settings: removing timeout");
			delete (this.settings as any)["timeout"];
			await this.saveSettings();
		}
	}
}
