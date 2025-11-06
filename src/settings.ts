import dedent from "dedent";
import i18next from "i18next";
import {
	type App,
	MarkdownRenderer,
	Notice,
	PluginSettingTab,
	Setting,
	sanitizeHTMLToDom,
} from "obsidian";
import { PickerSettingsComponent } from "./color-picker";
import type { ColorCompiler } from "./compiler";
import type { SimpleColoredFolderSettings } from "./interfaces";
import type SimpleColoredFolder from "./main";

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
			await MarkdownRenderer.render(
				this.app,
				dedent`> [!warning]
				> ${i18next.t("notEnabled")}  
				>
				> ${i18next.t("reload")}
				`,
				this.containerEl,
				"",
				this.plugin
			);
			return;
		}

		this.containerEl.addClass(`spf`);

		containerEl.empty();

		const timeOutdesc = sanitizeHTMLToDom(
			`${i18next.t("settings.timeout.desc")}<br/>${i18next.t("settings.timeout.explain", {
				code: "<code>timeout*100ms</code>",
			})}<br>${i18next.t("settings.timeout.reload")}`
		);

		new Setting(containerEl)
			.setName(i18next.t("settings.timeout.title"))
			.setDesc(timeOutdesc);
		new Setting(containerEl)
			.setName(i18next.t("settings.timeout.mobile"))
			.setClass("no-border")
			.setClass("left")
			.setDesc(
				sanitizeHTMLToDom(
					`${i18next.t("settings.timeout.mobileDesc", {
						calc: `<code>${(this.settings.maxTimeout.mobile * 100) / 1000}s</code>`,
					})}`
				)
			)
			.addText((text) => {
				text.setValue(this.settings.maxTimeout.mobile.toString());
				text.inputEl.onblur = async () => {
					const value = parseInt(text.getValue(), 10);
					if (!isNaN(value)) {
						this.settings.maxTimeout.mobile = value;
						await this.plugin.saveSettings();
						//remove the error class if present
						text.inputEl.classList.remove("spf-error");
						await this.display();
					} else {
						new Notice(
							sanitizeHTMLToDom(
								`<span class="spf-warning">${i18next.t("settings.timeout.invalid")}</span>`
							)
						);
						text.inputEl.classList.add("spf-error");
					}
				};
			});

		new Setting(containerEl)
			.setName(i18next.t("settings.timeout.desktop"))
			.setDesc(
				sanitizeHTMLToDom(
					`${i18next.t("settings.timeout.mobileDesc", {
						calc: `<code>${(this.settings.maxTimeout.desktop * 100) / 1000}s</code>`,
					})}`
				)
			)
			.setClass("no-border")
			.setClass("left")
			.addText((text) => {
				text.setValue(this.settings.maxTimeout.desktop.toString());
				text.inputEl.onblur = async () => {
					const value = parseInt(text.getValue(), 10);
					if (!isNaN(value)) {
						this.settings.maxTimeout.desktop = value;
						await this.plugin.saveSettings();
						//remove the error class if present
						text.inputEl.classList.remove("spf-error");
						await this.display();
					} else {
						new Notice(
							sanitizeHTMLToDom(
								`<span class="spf-warning">${i18next.t("settings.timeout.invalid")}</span>`
							)
						);
						text.inputEl.classList.add("spf-error");
					}
				};
			});

		this.containerEl.createEl("hr");

		new Setting(containerEl)
			.setName(i18next.t("settings.snippets.title"))
			.setClass("no-border")
			.setDesc(i18next.t("settings.snippets.desc"))
			.addToggle((cb) =>
				cb.setValue(this.settings.exportToCSS).onChange(async (value) => {
					this.settings.exportToCSS = value;
					await this.plugin.saveSettings();
					await this.compiler.injectStyles();
					await this.display();
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
		new Setting(containerEl)
			.setName(i18next.t("settings.defaultColor"))
			.setClass("no-border")
			.setHeading();

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

		await MarkdownRenderer.render(
			this.app,
			dedent`
			${i18next.t("settings.prefix.desc")}
			${i18next.t("prefix.settings.generation")} « \`prefix.${i18next.t("common.folderName")}\` » ${i18next.t("settings.prefix.folderName")}
			> [!warning] ${i18next.t("common.warning")}
			> ${i18next.t("settings.warning")}
			`,
			this.containerEl,
			"",
			this.plugin
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
