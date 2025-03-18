import { type App, PluginSettingTab, Setting } from "obsidian";
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
			.setHeading();

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
	}
}
