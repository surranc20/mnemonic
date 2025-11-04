import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { encodingForModel } from "@langchain/core/utils/tiktoken";
import IEmbeddingAdapter from "./IEmbeddingAdapter.js";

export default class OpenAiEmbedder implements IEmbeddingAdapter {
	constructor(private openAiKey: string) {}
	async generateChunksAndEmbeddings(text: string) {
		const encoder = await encodingForModel("text-embedding-3-small");
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
			separators: ["\n\n", "\n", " ", ""],
			lengthFunction: (text: string) => {
				const tokens = encoder.encode(text);
				return tokens.length;
			},
		});

		const chunks = await textSplitter.createDocuments([text]);

		const embeddings = new OpenAIEmbeddings({
			modelName: "text-embedding-3-small",
			apiKey: this.openAiKey,
		});

		const vectorStore = await embeddings.embedDocuments(
			chunks.map((chunk) => chunk.pageContent)
		);

		return { chunks, vectorStore };
	}
}
