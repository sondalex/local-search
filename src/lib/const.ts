import { Model, ModelType } from './types'

const SEARCH_COLUMN = 'content'
const VECTOR_EMBEDDING_COLUMN = 'embedding'
const CATEGORY_COLUMN = 'categories'
const MAX_FILE_SIZE = 50 * 1024 * 1024
const DATASET_REPO_ID = 'sondalex/arxiv-abstracts-2021-embeddings-10000'

const NUMBER_POPULAR_CATEGORIES = 5
const SEMANTIC_MODELS: Model[] = [
    {
        type: ModelType.MiniLM,
        dimension: 384,
        info: {
            name: 'All-MiniLM-L6-v2',
            description: 'Fast, lightweight model for semantic search',
            strengths: [
                'Very fast for real-time browser search',
                'Good accuracy for general queries',
                'Low memory, works on most devices',
            ],
            weaknesses: [
                'Less accurate for complex queries',
                'Limited multilingual support',
            ],
            icon: '⏱️',
            color: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
            accentColor: 'text-purple-600 dark:text-purple-400',
            modelCard:
                'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2',
        },
    },
    {
        type: ModelType.ArcticEmbedMedium,
        dimension: 768,
        info: {
            name: 'Arctic-Embed-M-v2.0',
            description: 'Medium-sized model with strong multilingual search',
            strengths: [
                'High accuracy across languages',
                'Efficient for large-scale search',
                'Balanced speed and quality',
            ],
            weaknesses: [],
            icon: '🌐',
            color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
            accentColor: 'text-blue-600 dark:text-blue-400',
            modelCard:
                'https://huggingface.co/Snowflake/snowflake-arctic-embed-m-v2.0',
        },
    },
    // ISSUE: Below model not compatible
    /*
    {
        id: "intfloat/e5-base-v2",
        info: {
        name: "E5-Base-v2",
        description: "Versatile model for semantic search",
        strengths: [
            "Strong accuracy on diverse datasets",
            "Good for general-purpose search",
            "Pre-trained on varied text"
        ],
        weaknesses: [
            "Needs fine-tuning for niche domains",
            "Server-side only, not browser-friendly"
        ],
        icon: "🔍",
        color: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
        accentColor: "text-amber-600 dark:text-amber-400",
        modelCard: "https://huggingface.co/intfloat/e5-base-v2"
        }
    },*/
    {
        type: ModelType.ArcticEmbedLarge,
        dimension: 1024,
        info: {
            name: 'Arctic-Embed-L-v2.0',
            description: 'Large model for high-accuracy multilingual search',
            strengths: [
                'Top accuracy for complex queries',
                'Supports multilingual and long contexts',
                'Outperforms many closed-source models',
            ],
            weaknesses: ['More resources needed'],
            icon: '🧠',
            color: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
            accentColor: 'text-green-600 dark:text-green-400',
            modelCard:
                'https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0',
        },
    },
]
export {
    SEARCH_COLUMN,
    VECTOR_EMBEDDING_COLUMN,
    CATEGORY_COLUMN,
    NUMBER_POPULAR_CATEGORIES,
    SEMANTIC_MODELS,
    MAX_FILE_SIZE,
    DATASET_REPO_ID,
}
