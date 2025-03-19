import { type App, PluginSettingTab, sanitizeHTMLToDom, Setting } from "obsidian";
import type SimpleColoredFolder from "./main";

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
			.setName("Prefix")
			.setDesc(
				"Prefix for variable generation. This will allow Style Settings to works, but you can edit them also in a CSS snippets."
			)
			.addButton((button) =>
				button.setButtonText("Reload style").onClick(async () => {
					this.plugin.injectStyles();
				})
			);

		new Setting(containerEl)
			.setName("Color")
			.setDesc("Color prefix")
			.addText((text) =>
				text.setValue(this.plugin.settings.prefix.color).onChange(async (value) => {
					this.plugin.settings.prefix.color = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Background")
			.setDesc("Background prefix")
			.addText((text) =>
				text.setValue(this.plugin.settings.prefix.bg).onChange(async (value) => {
					this.plugin.settings.prefix.bg = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Custom Template")
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					"Custom CSS template. Use the following variables: <code>${folderName}</code>, <code>${bg}</code>, <code>${color}</code>"
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
			.setName("Custom Style Settings")
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					"Custom Style Settings. Use the following variables: <code>${folderName}</code>, <code>${bg}</code>, <code>${color}</code>. <br>Please use the syntaxe from <a href='https://github.com/mgmeyers/obsidian-style-settings'>the plugin</a> without the properties <code>/* @settings</code>, <code>name</code>, <code>id</code>, and <code>settings</code>."
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
