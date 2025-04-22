import { type App, PluginSettingTab, sanitizeHTMLToDom, Setting } from "obsidian";
import type SimpleColoredFolder from "./main";
import i18next from "i18next";
import type { ColorCompiler } from "./compiler";
import type { SimpleColoredFolderSettings } from "./interfaces";
import { PickerSettingsComponent } from "./color-picker";

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

	display(): void {
		const { containerEl } = this;
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
		new Setting(containerEl).setName("Default color").setClass("no-border").setHeading();

		new PickerSettingsComponent(
			containerEl,
			"Background",
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
			"Text color",
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

		this.containerEl.appendChild(
			sanitizeHTMLToDom(`${i18next.t("settings.prefix.desc")}<br>${i18next.t("prefix.settings.generation")} <code>prefix.[${i18next.t("common.folderName")}]</code> ${i18next.t("settings.prefix.folderName")}
			<div data-callout-metadata="" data-callout-fold="" data-callout="warning" class="callout"><div class="callout-title" dir="auto"><div class="callout-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg></div><div class="callout-title-inner">${i18next.t("common.warning")}</div></div><div class="callout-content">
					<p dir="auto">${i18next.t("settings.warning")}</p>
					</div></div>`)
		);

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
