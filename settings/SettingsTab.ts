import AIPlugin from "main.js";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";

export interface PluginSettings {
	openAiKey: string;
	zillizUrl: string;
	zillizCollectionName: string;
	zillizApiKey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	openAiKey: "",
	zillizUrl: "",
	zillizCollectionName: "",
	zillizApiKey: "",
};

export interface PersistentStorage {
	initialSetupComplete: Record<string, "DONE" | "ACTIVE" | "INACTIVE">;
}

export default class SettingsTab extends PluginSettingTab {
	plugin: AIPlugin;
	settings: PluginSettings;

	constructor(app: App, plugin: AIPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = plugin.persistentStorageService.settings;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Open AI Key")
			.setDesc(
				"Used to create embeddings. Warning: Stored in plain text in vault"
			)
			.addText((text) => {
				text.setPlaceholder("sk-...")
					.setValue(this.settings.openAiKey)
					.onChange(async (value) => {
						this.settings.openAiKey = value;
						await this.plugin.onSettingsUpdated();
					});
				(text.inputEl as HTMLInputElement).type = "password";
			});

		new Setting(containerEl)
			.setName("Zilliz Url")
			.setDesc("Used to store/query embeddings.")
			.addText((text) =>
				text
					.setPlaceholder("Enter url")
					.setValue(this.settings.zillizUrl)
					.onChange(async (value) => {
						this.settings.zillizUrl = value;
						await this.plugin.onSettingsUpdated();
					})
			);

		new Setting(containerEl)
			.setName("Zilliz Collection")
			.setDesc("Collection that holds embeddings.")
			.addText((text) =>
				text
					.setPlaceholder("Enter collection")
					.setValue(this.settings.zillizCollectionName)
					.onChange(async (value) => {
						this.settings.zillizCollectionName = value;
						await this.plugin.onSettingsUpdated();
					})
			);

		new Setting(containerEl)
			.setName("Zilliz API Key")
			.setDesc(
				"Key needed to connect to database. Warning: Stored in plain text in vault"
			)
			.addText((text) => {
				text.setPlaceholder("Enter key")
					.setValue(this.settings.zillizApiKey)
					.onChange(async (value) => {
						this.settings.zillizApiKey = value;
						await this.plugin.onSettingsUpdated();
					});
				(text.inputEl as HTMLInputElement).type = "password";
			});

		new Setting(containerEl)
			.setName("Reset Embeddings")
			.setDesc(
				"Creates new embeddings for your vault and deletes the old ones"
			)
			.addButton((button) => {
				button
					.setButtonText("Reset")
					.setWarning()
					.onClick(async () => {
						button.setDisabled(true);
						try {
							await this.plugin.embeddingsService.ensureEmbeddingsCreatedForVault(
								true
							);
						} catch (e) {
							console.error(e);
							new Notice("Failed to reset embeddings.");
						} finally {
							button.setDisabled(false);
						}
					});
			});
	}
}
