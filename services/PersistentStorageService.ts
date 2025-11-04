import AIPlugin from "main";

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

export default class PersistentStorageService {
	private static instance: PersistentStorageService | null = null;

	public adapterStatusMapper: Record<string, "DONE" | "ACTIVE" | "INACTIVE">;
	public settings: PluginSettings;

	private constructor(private plugin: AIPlugin) {}

	public static getInstance(plugin: AIPlugin) {
		if (!PersistentStorageService.instance) {
			PersistentStorageService.instance = new PersistentStorageService(
				plugin
			);
		}
		return PersistentStorageService.instance;
	}

	public async load() {
		const loadedData = await this.plugin.loadData();
		this.adapterStatusMapper = loadedData.adapterStatusMapper || {};
		this.settings = loadedData.settings;
	}

	public async save() {
		await this.plugin.saveData({
			adapterStatusMapper: this.adapterStatusMapper,
			settings: this.settings,
		});
	}
}
