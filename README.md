# Mnemonic - Semantic Search Plugin for Obsidian

Mnemonic is an Obsidian plugin that provides semantic search capabilities using RAG (Retrieval-Augmented Generation). It automatically creates embeddings for your markdown files and allows you to search your vault using natural language queries to find semantically similar content.

## Features

- **Automatic Embedding Generation**: Automatically creates embeddings for all markdown files in your vault
- **Real-time Updates**: Updates embeddings when files are modified
- **Semantic Search**: Search your vault using natural language queries instead of exact text matching
- **Vector Database Integration**: Uses Zilliz as the vector database backend
- **OpenAI Integration**: Uses OpenAI's embedding models to generate vector representations

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm (comes with Node.js)
- An OpenAI API key
- A Zilliz account and collection (for vector storage)

## Installation

1. Clone or download this repository to your Obsidian vault's plugins directory:
   ```
   <Vault>/.obsidian/plugins/mnemonic/
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Enable the plugin in Obsidian:
   - Go to **Settings → Community plugins**
   - Enable the "Mnemonic" plugin

## Configuration

1. Open Obsidian settings and navigate to the Mnemonic plugin settings
2. Configure the following:
   - **OpenAI Key**: Your OpenAI API key (stored in plain text in your vault)
   - **Zilliz URL**: Your Zilliz instance URL
   - **Zilliz Collection**: The collection name where embeddings will be stored
   - **Zilliz API Key**: Your Zilliz API key for authentication

3. After configuring, the plugin will automatically:
   - Create embeddings for all existing markdown files in your vault
   - Set up listeners to update embeddings when files are modified

## Running the Plugin

### Development Mode

To run the plugin in development mode with watch functionality:

```bash
npm run dev
```

This will:
- Watch for file changes and automatically rebuild
- Compile TypeScript to JavaScript
- Output `main.js` to the plugin root

### Production Build

To create an optimized production build:

```bash
npm run build
```

This will:
- Type-check the code
- Build and bundle everything into `main.js`
- Prepare the plugin for distribution

### Manual Installation for Testing

After building, copy these files to your vault's plugin directory:
- `main.js`
- `manifest.json`
- `styles.css` (if present)

Location: `<Vault>/.obsidian/plugins/mnemonic/`

Then reload Obsidian and enable the plugin.

## Usage

1. **Open the Semantic Search View**: Click the search icon in the left ribbon, or use the command palette
2. **Search**: Type your query in the search box. Results will appear automatically as you type (with a 300ms debounce)
3. **Navigate**: Click on any result to open the corresponding file in Obsidian

## Project Structure

```
mnemonic/
├── main.ts                          # Plugin entry point and lifecycle management
├── manifest.json                    # Plugin manifest (metadata)
├── package.json                     # Dependencies and build scripts
├── tsconfig.json                    # TypeScript configuration
├── esbuild.config.mjs              # Build configuration
│
├── DatabaseAdapters/                    # Vector database integration layer
│   ├── IDatabaseAdapter.ts         # Interface for database adapters
│   └── ZillizAdapter.ts            # Zilliz implementation
│
├── EmbeddingAdapters/                  # Embedding model integration
│   ├── IEmbeddingAdapter.ts        # Interface for embedding adapters
│   └── OpenAiEmbedder.ts           # OpenAI embeddings implementation
│
├── services/                           # Core business logic
│   ├── EmbeddingsService.ts        # Manages embedding creation and search
│   └── PersistentStorageService.ts # Handles plugin settings and state
│
├── settings/                           # User interface
│   └── SettingsTab.ts               # Plugin settings UI
│
└── views/                              # Obsidian UI components
    └── SearchView.ts                 # Semantic search view component
```

## Code Architecture

### Entry Point (`main.ts`)

The plugin's main class `AIPlugin` extends Obsidian's `Plugin` class and handles:
- Plugin lifecycle (onload/onunload)
- Service initialization
- Event registration (file modification listeners)
- View registration (semantic search view)
- Settings tab registration
- Ribbon icon for quick access

### Service Layer

**`EmbeddingsService`** (`services/EmbeddingsService.ts`):
- Core service that orchestrates embedding creation and search
- Manages database and embedding adapters
- Handles file watching and automatic embedding updates
- Performs similarity searches
- Tracks embedding status for each adapter

**`PersistentStorageService`** (`services/PersistentStorageService.ts`):
- Singleton service for managing plugin state
- Handles loading/saving settings and adapter status
- Persists data to Obsidian's plugin data storage

### Adapter Pattern

The plugin uses an adapter pattern to support multiple embedding and database providers:

**Database Adapters** (`DatabaseAdapters/`):
- `IDatabaseAdapter`: Interface defining methods for vector storage
  - `deleteEmbeddings()`: Remove embeddings for a file
  - `saveEmbeddings()`: Store embeddings and chunks
  - `similaritySearch()`: Search for similar content
- `ZillizAdapter`: Implementation for Zilliz vector database

**Embedding Adapters** (`EmbeddingAdapters/`):
- `IEmbeddingAdapter`: Interface for embedding generation
  - `generateChunksAndEmbeddings()`: Split text and create embeddings
- `OpenAiEmbedder`: Implementation using OpenAI's embedding models
  - Uses LangChain's `RecursiveCharacterTextSplitter` for chunking
  - Uses `OpenAIEmbeddings` with `text-embedding-3-small` model

### User Interface

**`SettingsTab`** (`settings/SettingsTab.ts`):
- Provides UI for configuring API keys and database settings
- Includes a "Reset Embeddings" button to regenerate all embeddings
- Settings are saved automatically when changed

**`RagSearchView`** (`views/SearchView.ts`):
- Custom Obsidian view for semantic search
- Provides a search input with debounced search
- Displays results with filename and matching text snippets
- Allows clicking results to open files

## Data Flow

### Initial Setup Flow

1. User configures API keys in settings
2. `onSettingsUpdated()` is called
3. `EmbeddingsService.updateAdapters()` initializes adapters
4. `ensureEmbeddingsCreatedForVault()` processes all markdown files:
   - For each file: reads content → generates chunks → creates embeddings → stores in database
5. Status is saved to track completion

### File Modification Flow

1. User modifies a markdown file
2. Obsidian fires `modify` event
3. `EmbeddingsService.createNewEmbeddingsForFile()` is triggered
4. Old embeddings are deleted, new ones are created and stored
5. User receives a notice confirming embedding creation

### Search Flow

1. User types a query in the search view
2. After 300ms debounce, `runSearch()` is called
3. Query is sent to `EmbeddingsService.performSimilaritySearch()`
4. Query is embedded using the embedding adapter
5. Vector similarity search is performed using the database adapter
6. Results are returned and displayed in the view

## Key Technologies

- **TypeScript**: Type-safe development
- **Obsidian API**: Plugin framework and UI components
- **LangChain**: Text splitting and embedding utilities
- **OpenAI API**: Embedding generation
- **Zilliz**: Vector database for similarity search
- **esbuild**: Fast bundling and compilation

## Development Workflow for New Contributors

### Getting Familiar with the Code

1. **Start with `main.ts`**: Understand the plugin lifecycle and entry point
2. **Read `services/EmbeddingsService.ts`**: This is the core business logic
3. **Review the adapters**: Understand how the plugin interfaces with external services
   - `EmbeddingAdapters/OpenAiEmbedder.ts` - How embeddings are created
   - `DatabaseAdapters/ZillizAdapter.ts` - How data is stored and queried
4. **Explore the UI components**: See how users interact with the plugin
   - `views/SearchView.ts` - The search interface
   - `settings/SettingsTab.ts` - Configuration UI
5. **Check `PersistentStorageService.ts`**: Understand how state is managed

### Adding New Features

1. **New Database Provider**: Implement `IDatabaseAdapter` in a new file in `DatabaseAdapters/`
2. **New Embedding Provider**: Implement `IEmbeddingAdapter` in a new file in `EmbeddingAdapters/`
3. **Update `EmbeddingsService.updateAdapters()`**: Add logic to instantiate new adapters based on settings
4. **Add settings**: Update `PluginSettings` interface and `SettingsTab` UI


## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

