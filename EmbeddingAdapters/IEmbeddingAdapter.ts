import { type Document } from "@langchain/core/documents";

export default interface IEmbeddingAdapter {
	generateChunksAndEmbeddings(text: string): Promise<{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		chunks: Document<Record<string, any>>[];
		vectorStore: number[][];
	}>;
}
