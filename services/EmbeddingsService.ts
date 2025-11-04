import IDatabaseAdapter from "DatabaseAdapters/IDatabaseAdapter";
import ZillizAdapter from "DatabaseAdapters/ZillizAdapter";
import IEmbeddingAdapter from "EmbeddingAdapters/IEmbeddingAdapter";
import OpenAiEmbedder from "EmbeddingAdapters/OpenAiEmbedder";
import AIPlugin from "main";
import { TAbstractFile, TFile, Notice, App } from "obsidian";
import PersistentStorageService from "./PersistentStorageService";

export default class EmbeddingsService {
	dbAdapter?: IDatabaseAdapter;
	embeddingAdapter?: IEmbeddingAdapter;
	persistentStorageService: PersistentStorageService;

	constructor(private app: App, private plugin: AIPlugin) {
		this.persistentStorageService =
			PersistentStorageService.getInstance(plugin);
	}

	async updateAdapters() {
		const settings = this.persistentStorageService.settings;
		if (
			settings.zillizApiKey &&
			settings.zillizCollectionName &&
			settings.zillizUrl
		) {
			this.dbAdapter = new ZillizAdapter(
				settings.zillizApiKey,
				settings.zillizCollectionName,
				settings.zillizUrl
			);
		}

		if (settings.openAiKey) {
			this.embeddingAdapter = new OpenAiEmbedder(settings.openAiKey);
		}

		await this.ensureEmbeddingsCreatedForVault();
	}

	async createNewEmbeddingsForFile(file: TAbstractFile) {
		if (
			file instanceof TFile &&
			this.dbAdapter &&
			this.embeddingAdapter &&
			file.extension == "md"
		) {
			const fileContent = await this.app.vault.read(file);
			const embedding =
				await this.embeddingAdapter.generateChunksAndEmbeddings(
					fileContent
				);

			try {
				await this.dbAdapter.deleteEmbeddings(file.name);
				await this.dbAdapter.saveEmbeddings(
					file.name,
					embedding.chunks,
					embedding.vectorStore
				);
				new Notice(`Created new embeddings for ${file.name}`);
			} catch (error) {
				new Notice(`Unable to create embeddings for ${file.name}`);
			}
		}
	}

	// TODO: Keep track of files embeddings have been created for
	// so that you can be effecient if user quits during initial
	// setup process (don't reprocess files).
	async ensureEmbeddingsCreatedForVault(overrideOldEmbeddings = false) {
		const adapterName = this.dbAdapter?.getName();
		if (!adapterName) {
			console.error(
				"Unable to create embeddings for vault without adapter"
			);
			return;
		}

		const adapterStatusMapper =
			this.persistentStorageService.adapterStatusMapper;
		const adapterStatus = adapterStatusMapper[adapterName];

		if (
			!overrideOldEmbeddings &&
			adapterStatus?.trim() &&
			adapterStatus !== "INACTIVE"
		) {
			console.log("Skipping embeddings creation");
			return;
		}

		console.log("creating embeddings");
		adapterStatusMapper[adapterName] = "ACTIVE";
		for (const file of this.app.vault.getFiles()) {
			await this.createNewEmbeddingsForFile(file);
		}

		adapterStatusMapper[adapterName] = "DONE";
		await this.persistentStorageService.save();
	}

	async performSimilaritySearch(query: string) {
		console.log("searching");
		if (!this.dbAdapter || !this.embeddingAdapter) {
			console.log(this.dbAdapter, this.embeddingAdapter);
			console.log("hit this point");
			return [];
		}
		try {
			const embedding =
				await this.embeddingAdapter.generateChunksAndEmbeddings(query);
			return await this.dbAdapter.similaritySearch(
				embedding.vectorStore[0]
			);
		} catch (error) {
			new Notice("Something went wrong searching for matches.");
			return [];
		}
	}

	async onUnload() {
		const adapterStatusMapper =
			this.persistentStorageService.adapterStatusMapper;
		Object.entries(adapterStatusMapper).forEach(([adapterName, status]) => {
			if (status === "ACTIVE") {
				adapterStatusMapper[adapterName] = "INACTIVE";
			}
		});
		await this.persistentStorageService.save();
	}
}
