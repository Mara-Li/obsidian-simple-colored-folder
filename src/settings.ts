import { type App, PluginSettingTab, sanitizeHTMLToDom, Setting } from "obsidian";
import type SimpleColoredFolder from "./main";
import i18next from "i18next";

export class SimpleColoredFolderSettingTab extends PluginSettingTab {
	plugin: SimpleColoredFolder;

	constructor(app: App, plugin: SimpleColoredFolder) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(i18next.t("settings.prefix.title"))
			.setDesc(
				sanitizeHTMLToDom(
					`${i18next.t("settings.prefix.desc")}<br>${i18next.t("prefix.settings.generation")} <code>prefix.[${i18next.t("common.folderName")}]</code> ${i18next.t("settings.prefix.folderName")}`
				)
			)
			.addButton((button) =>
				button.setButtonText(i18next.t("settings.reload")).onClick(async () => {
					this.plugin.injectStyles();
				})
			);

		new Setting(containerEl).setName(i18next.t("settings.color")).addText((text) =>
			text.setValue(this.plugin.settings.prefix.color).onChange(async (value) => {
				this.plugin.settings.prefix.color = value;
				await this.plugin.saveSettings();
			})
		);

		new Setting(containerEl).setName(i18next.t("settings.background")).addText((text) =>
			text.setValue(this.plugin.settings.prefix.bg).onChange(async (value) => {
				this.plugin.settings.prefix.bg = value;
				await this.plugin.saveSettings();
			})
		);

		new Setting(containerEl)
			.setName(i18next.t("settings.customCss.title"))
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					`${i18next.t("settings.customCss.desc")} <code>\${folderName}</code>, <code>\${bg}</code>, <code>\${color}</code>`
				)
			);
		new Setting(containerEl)
			.setNoInfo()
			.setClass("spf-textarea")
			.addTextArea((text) =>
				text.setValue(this.plugin.settings.customTemplate).onChange(async (value) => {
					this.plugin.settings.customTemplate = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(i18next.t("settings.styleSettings.title"))
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					`${i18next.t("settings.styleSettings.desc")} <code>\${folderName}</code>, <code>\${bg}</code>, <code>\${color}</code>. <br>${i18next.t("settings.styleSettings.consigne")} <a href='https://github.com/mgmeyers/obsidian-style-settings'>${i18next.t("settings.styleSettings.plugin")}</a> ${i18next.t("settings.styleSettings.without")} <code>/* @settings</code>, <code>name</code>, <code>id</code>, and <code>settings</code>.`
				)
			);

		new Setting(containerEl)
			.setNoInfo()
			.setClass("spf-textarea")
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.customStyleSettings)
					.onChange(async (value) => {
						this.plugin.settings.customStyleSettings = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
