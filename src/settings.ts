import { type App, MarkdownRenderer, PluginSettingTab, sanitizeHTMLToDom, Setting } from "obsidian";
import type SimpleColoredFolder from "./main";
import i18next from "i18next";
import type { ColorCompiler } from "./compiler";
import type { SimpleColoredFolderSettings } from "./interfaces";
import { PickerSettingsComponent } from "./color-picker";
import dedent from "dedent";

export class SimpleColoredFolderSettingTab extends PluginSettingTab {
	plugin: SimpleColoredFolder;
	settings: SimpleColoredFolderSettings;
	compiler: ColorCompiler;

	constructor(app: App, plugin: SimpleColoredFolder) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = plugin.settings;
		this.compiler = plugin.compiler;
	}

	async display() {
		const { containerEl } = this;

		containerEl.empty();
		const styleSettings = this.app.plugins.getPlugin("obsidian-style-settings");
		if (!styleSettings?._loaded) {
			await MarkdownRenderer.render(this.app, dedent`> [!warning]
				> ${i18next.t("notEnabled")}  
				>
				> ${i18next.t("reload")}
				`, this.containerEl, "", this.plugin);
			return;
		}

		this.containerEl.addClass(`spf`);

		containerEl.empty();
		new Setting(containerEl)
			.setName(i18next.t("settings.snippets.title"))
			.setClass("no-border")
			.setDesc(i18next.t("settings.snippets.desc"))
			.addToggle((cb) =>
				cb.setValue(this.settings.exportToCSS).onChange(async (value) => {
					this.settings.exportToCSS = value;
					await this.plugin.saveSettings();
					await this.compiler.injectStyles();
					this.display();
				})
			);
		if (this.settings.exportToCSS) {
			new Setting(containerEl)
				.setName(i18next.t("settings.export.title"))
				.setDesc(i18next.t("settings.export.desc"))
				.setClass("no-border")
				.addToggle((cb) =>
					cb.setValue(this.settings.includeStyleInExport).onChange(async (value) => {
						this.settings.includeStyleInExport = value;
						await this.plugin.saveSettings();
						await this.compiler.injectStyles();
					})
				);
		}
		this.containerEl.createEl("hr");
		new Setting(containerEl).setName(i18next.t("settings.defaultColor")).setClass("no-border").setHeading();

		new PickerSettingsComponent(
			containerEl,
			i18next.t("common.background"),
			this.settings.defaultColors.bg,
			async (value) => {
				this.settings.defaultColors.bg.themeLight = value.themeLight;
				this.settings.defaultColors.bg.themeDark = value.themeDark;
				await this.plugin.saveSettings();
				await this.compiler.injectStyles();
			}
		);
		new PickerSettingsComponent(
			containerEl,
			i18next.t("common.color"),
			this.settings.defaultColors.color,
			async (value) => {
				this.settings.defaultColors.color.themeLight = value.themeLight;
				this.settings.defaultColors.color.themeDark = value.themeDark;
				await this.plugin.saveSettings();
				await this.compiler.injectStyles();
			}
		);
		this.containerEl.createEl("hr");
		new Setting(containerEl).setName(i18next.t("settings.prefix.title")).setHeading();

		await MarkdownRenderer.render(this.app, dedent`
			${i18next.t("settings.prefix.desc")}
			${i18next.t("prefix.settings.generation")} « \`prefix.${i18next.t("common.folderName")}\` » ${i18next.t("settings.prefix.folderName")}
			> [!warning] ${i18next.t("common.warning")}
			> ${i18next.t("settings.warning")}
			`, this.containerEl, "", this.plugin);

		new Setting(containerEl)
			.setName(i18next.t("common.color"))
			.setClass("no-border")
			.addText((text) => {
				text.setValue(this.settings.prefix.color).onChange(async (value) => {
					this.settings.prefix.color = value;
					await this.plugin.saveSettings();
				});
				text.inputEl.onblur = async () => {
					await this.compiler.injectStyles();
				};
			});

		new Setting(containerEl)
			.setClass("no-border")
			.setName(i18next.t("common.background"))
			.addText((text) => {
				text.setValue(this.settings.prefix.bg).onChange(async (value) => {
					this.settings.prefix.bg = value;
					await this.plugin.saveSettings();
				});
				text.inputEl.onblur = async () => {
					await this.compiler.injectStyles();
				};
			});

		this.containerEl.createEl("hr");

		new Setting(containerEl)
			.setName(i18next.t("settings.customCss.title"))
			.setHeading()
			.setClass("no-border")
			.setDesc(
				sanitizeHTMLToDom(
					`${i18next.t("settings.customCss.desc")} <code>\${folderName}</code>, <code>\${bg}</code>, <code>\${color}</code>`
				)
			);
		new Setting(containerEl)
			.setClass("no-border")
			.setNoInfo()
			.addTextArea((text) => {
				text.setValue(this.settings.customTemplate).onChange(async (value) => {
					this.settings.customTemplate = value;
					await this.plugin.saveSettings();
				});
				text.inputEl.onblur = async () => {
					await this.compiler.injectStyles();
				};
			});
		this.containerEl.createEl("hr");
		new Setting(containerEl)
			.setName(i18next.t("settings.styleSettings.title"))
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					`${i18next.t("settings.styleSettings.desc")} <code>\${folderName}</code>, <code>\${bg}</code>, <code>\${color}</code>. <br>${i18next.t("settings.styleSettings.consigne")} <a href='https://github.com/mgmeyers/obsidian-style-settings'>${i18next.t("settings.styleSettings.plugin")}</a> ${i18next.t("settings.styleSettings.without")} <code>/* @settings</code>, <code>name</code>, <code>id</code>, and <code>settings</code>.`
				)
			);

		new Setting(containerEl)
			.setClass("no-border")
			.setNoInfo()
			.addTextArea((text) => {
				text.setValue(this.settings.customStyleSettings).onChange(async (value) => {
					this.settings.customStyleSettings = value;
					await this.plugin.saveSettings();
				});
				text.inputEl.onblur = async () => {
					await this.compiler.injectStyles();
				};
			});
	}
}
