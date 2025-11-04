import { type Document } from "@langchain/core/documents";

export default interface IDatabaseAdapter {
	getName: () => string;
	deleteEmbeddings: (filename: string) => Promise<void>;
	saveEmbeddings: (
		filename: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		chunks: Document<Record<string, any>>[],
		embeddings: number[][]
	) => Promise<void>;
	similaritySearch: (
		vector: number[]
	) => Promise<{ filename: string; matchingText: string }[]>;
}
