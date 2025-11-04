import { type Document } from "@langchain/core/documents";
import { requestUrl } from "obsidian";
import IDatabaseAdapter from "./IDatabaseAdapter.js";

export default class ZillizAdapter implements IDatabaseAdapter {
	name: string;
	constructor(
		private apiKey: string,
		private collectionName: string,
		private url: string
	) {
		this.name = "Zilliz";
	}

	getName() {
		return `Zilliz-${this.apiKey}-${this.collectionName}-${this.url}`;
	}

	async deleteEmbeddings(filename: string) {
		const response = await requestUrl({
			url: `${this.url}/delete`,
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				collectionName: this.collectionName,
				filter: `filename == "${this.escapeForDatabase(filename)}"`,
			}),
		});

		if (response.status !== 200 || response.json.code !== 0) {
			const errorMsg = `Error deleting embeddings for ${filename}`;
			console.error(errorMsg, response.text);
			throw new Error(errorMsg);
		}
	}

	async saveEmbeddings(
		filename: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		chunks: Document<Record<string, any>>[],
		embeddings: number[][]
	) {
		if (chunks.length !== embeddings.length) {
			const errorMsg = "Can't match embeddings to source material";
			console.error(errorMsg);
			throw new Error(errorMsg);
		}

		const data = chunks
			.map((chunk, index) => {
				return {
					text: chunk.pageContent,
					vector: embeddings[index],
					filename: this.escapeForDatabase(filename),
				};
			})
			.filter(
				(item) => item.filename && item.text && item.vector?.length
			);

		if (!data.length) {
			return;
		}

		const response = await requestUrl({
			url: `${this.url}/insert`,
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				collectionName: this.collectionName,
				data,
			}),
		});

		if (response.status !== 200 || response.json?.code !== 0) {
			console.error(
				"Unable to upload embeddings",
				response.json,
				filename,
				data
			);
			throw new Error("Unable to upload embeddings");
		}
	}

	async similaritySearch(vector: number[]) {
		const response = await requestUrl({
			url: `${this.url}/search`,
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				collectionName: this.collectionName,
				data: [vector],
				limit: 10,
				outputFields: ["*"],
			}),
		});

		if (response.status !== 200 || response.json?.code !== 0) {
			const errorMsg = "Unable to perform search";
			console.error(errorMsg, response.json);
			throw new Error(errorMsg);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return response.json.data.map((match: any) => {
			return { filename: match.filename, matchingText: match.text };
		});
	}

	escapeForDatabase(str: string): string {
		return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	}
}
