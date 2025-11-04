import { Plugin } from "obsidian";
import IDatabaseAdapter from "DatabaseAdapters/IDatabaseAdapter.js";
import IEmbeddingAdapter from "EmbeddingAdapters/IEmbeddingAdapter.js";
import { RAG_VIEW_TYPE, RagSearchView } from "views/SearchView.js";
import PersistentStorageService from "services/PersistentStorageService.js";
import SettingsTab from "settings/SettingsTab.js";
import EmbeddingsService from "services/EmbeddingsService.js";

export default class AIPlugin extends Plugin {
	persistentStorageService = PersistentStorageService.getInstance(this);
	embeddingsService = new EmbeddingsService(this.app, this);
	dbAdapter?: IDatabaseAdapter;
	embeddingAdapter?: IEmbeddingAdapter;

	async onload() {
		await this.persistentStorageService.load();
		this.embeddingsService.updateAdapters();
		this.registerEvent(
			this.app.vault.on("modify", async (file) =>
				this.embeddingsService.createNewEmbeddingsForFile(file)
			)
		);

		this.registerView(
			RAG_VIEW_TYPE,
			(leaf) =>
				new RagSearchView(leaf, (query) =>
					this.embeddingsService.performSimilaritySearch(query)
				)
		);

		this.addSettingTab(new SettingsTab(this.app, this));
		this.addRibbonIcon("search-code", "AI Search", async () => {
			await this.toggleRagSearchView();
		});
	}

	async onunload() {
		await this.embeddingsService.onUnload();
	}

	async onSettingsUpdated() {
		await this.persistentStorageService.save();
		this.embeddingsService.updateAdapters();
	}

	async toggleRagSearchView() {
		const { workspace } = this.app;

		const existingLeaf = workspace.getLeavesOfType(RAG_VIEW_TYPE)[0];
		if (existingLeaf) {
			existingLeaf.detach();
			return;
		}

		workspace.leftSplit.expand();
		let leaf = workspace.getLeftLeaf(false);

		if (!leaf) {
			leaf = workspace.getLeaf(true);
		}

		await leaf.setViewState({ type: RAG_VIEW_TYPE, active: true });
		workspace.revealLeaf(leaf);
	}
}
