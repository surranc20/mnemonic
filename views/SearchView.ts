import { ItemView, WorkspaceLeaf } from "obsidian";

export const RAG_VIEW_TYPE = "rag-search-view";

export class RagSearchView extends ItemView {
	private inputEl: HTMLInputElement;
	private resultsEl: HTMLElement;
	private currentQuery = "";

	constructor(
		leaf: WorkspaceLeaf,
		private onSearch: (
			query: string
		) => Promise<{ filename: string; matchingText: string }[]>
	) {
		super(leaf);
	}

	getViewType(): string {
		return RAG_VIEW_TYPE;
	}

	getIcon() {
		return "search-code";
	}

	getDisplayText(): string {
		return "Semantic Search";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h2", { text: "Semantic Search" });

		this.inputEl = container.createEl("input", {
			type: "text",
			placeholder: "Type your query...",
			cls: "rag-search-input",
		});

		setTimeout(() => this.inputEl.focus(), 0);

		this.resultsEl = container.createDiv("rag-search-results");

		let timeout: number;
		this.inputEl.addEventListener("input", () => {
			clearTimeout(timeout);
			const query = this.inputEl.value.trim();
			if (!query) {
				this.resultsEl.empty();
				return;
			}
			timeout = window.setTimeout(() => this.runSearch(query), 300);
		});
	}

	private async runSearch(query: string) {
		this.resultsEl.empty();
		this.resultsEl.createEl("p", { text: "Searching..." });

		try {
			this.currentQuery = query;
			const results = await this.onSearch(query);
			if (this.currentQuery === query) {
				this.renderResults(results);
			}
		} catch (err) {
			console.error(err);
			this.resultsEl.empty();
			this.resultsEl.createEl("p", { text: "Error running search" });
		}
	}

	private renderResults(
		results: { filename: string; matchingText: string }[]
	) {
		this.resultsEl.empty();
		if (results.length === 0) {
			this.resultsEl.createEl("p", { text: "No matches found." });
			return;
		}

		for (const result of results) {
			const item = this.resultsEl.createDiv({ cls: "rag-result-item" });

			const titleEl = item.createEl("div", { cls: "rag-result-title" });
			titleEl.setText(result.filename);

			const snippetEl = item.createEl("div", {
				cls: "rag-result-snippet",
			});
			snippetEl.setText(result.matchingText);

			item.addEventListener("click", async () => {
				await this.app.workspace.openLinkText(
					result.filename,
					"",
					true
				);
			});
		}
	}

	async onClose() {
		this.containerEl.empty();
	}
}
