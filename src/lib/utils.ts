import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AsyncDuckDB } from '@duckdb/duckdb-wasm'
import { downloadFile, RepoDesignation } from '@huggingface/hub'
import * as arrow from 'apache-arrow'
import { Table, Vector } from 'apache-arrow'
import { RowData } from '@/lib/types'
import {
    pipeline,
    env,
    FeatureExtractionPipeline,
    ProgressCallback,
} from '@huggingface/transformers'
import {
    Model,
    ModelType,
    ReceiverInferData,
    WorkerInferData,
    WorkerProgressCallbackData,
} from '@/lib/types'
import { readParquet } from 'parquet-wasm'
import { NUMBER_POPULAR_CATEGORIES } from './const'
import { PretrainedModelOptions } from 'node_modules/@huggingface/transformers/types/utils/hub'

env.allowLocalModels = false
env.useBrowserCache = true

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface SearchParams {
    searchQuery: string
    selectedCategories: string[]
    dataSource: string
    useSemanticSearch: boolean // New parameter for search type
    embedding?: number[]
    column: string
    vectorEmbeddingColumn: string
    model?: Model
}

interface SearchOptions {
    limit?: number
}
const buildAndExecuteSearch = async (
    db: AsyncDuckDB,
    params: SearchParams,
    options: SearchOptions = { limit: 100 }
): Promise<RowData[]> => {
    const { column, vectorEmbeddingColumn } = params

    const conn = await db.connect()

    try {
        if (params.useSemanticSearch) {
            if (!params.embedding) {
                throw new Error(
                    'params.embedding must be set when using semantic search'
                )
            }
            if (!params.model) {
                throw new Error(
                    'params.model must set when using semantic search'
                )
            }
            if (params.embedding.length !== params.model.dimension) {
                throw new Error(
                    `Embedding must have exactly ${params.model.dimension} dimensions, got ${params.embedding.length}`
                )
            }

            await conn.query(`
                CREATE TEMP TABLE datatable (
                    id VARCHAR,
                    ${column} VARCHAR,
                    ${vectorEmbeddingColumn} FLOAT[${params.model.dimension}]
                );

                INSERT INTO datatable
                SELECT 
                    id,
                    ${column},
                    ${vectorEmbeddingColumn}::FLOAT[${params.model.dimension}]
                FROM read_parquet('${params.dataSource}');
                
                CREATE INDEX datatable_embedding_idx
                ON datatable
                USING HNSW (${vectorEmbeddingColumn});
            `)
            const type = new arrow.FixedSizeList(
                params.model.dimension,
                new arrow.Field('value', new arrow.Float32())
            )
            const schema = new arrow.Schema([
                new arrow.Field('embedding', type),
            ])

            const floatArray = new Float32Array(params.embedding)

            const childData = arrow.makeData({
                type: new arrow.Float32(),
                data: floatArray,
            })

            // Create the list data
            const listData = arrow.makeData({
                type: type,
                length: 1,
                child: childData,
            })

            const data = arrow.makeData({
                type: new arrow.Struct(schema.fields),
                children: [listData],
            })

            const recordBatch = new arrow.RecordBatch(schema, data)

            const table = new arrow.Table(schema, recordBatch)

            await conn.insertArrowTable(table, { name: 'query_embedding' })
        } else {
            await conn.query(`
                CREATE TEMP TABLE datatable AS 
                SELECT 
                    id,
                    ${column}
                FROM read_parquet('${params.dataSource}');
            `)

            await conn.query(`
                PRAGMA create_fts_index(
                    'datatable',
                    'id',
                    '${column}'
                );
            `)
        }

        const sql = buildSearchQuery(params, options)
        const result = await conn.query(sql)

        if (params.useSemanticSearch) {
            await conn.query('DROP INDEX datatable_embedding_idx')
            await conn.query('DROP TABLE query_embedding;')
        } else {
            await conn.query("PRAGMA drop_fts_index('datatable')")
        }
        await conn.query('DROP TABLE IF EXISTS datatable;')

        return transformResults(result)
    } finally {
        await conn.close()
    }
}

function buildSearchQuery(
    {
        searchQuery,
        selectedCategories,
        useSemanticSearch,
        vectorEmbeddingColumn,
        column,
    }: SearchParams,
    { limit }: SearchOptions
): string {
    let sql

    // Build the category filter using array_contains
    const categoryConditions =
        selectedCategories.length > 0
            ? `WHERE ${selectedCategories
                  .map((cat) => `array_contains(categories, '${cat}')`)
                  .join(' OR ')}`
            : ''

    if (useSemanticSearch) {
        sql = `
            WITH filtered_papers AS (
                SELECT id, ${column}, ${vectorEmbeddingColumn}
                FROM datatable
                ${categoryConditions}
            )
            SELECT 
                p.id,
                p.${column},
                array_cosine_distance(
                    p.${vectorEmbeddingColumn},
                    (SELECT ${vectorEmbeddingColumn} FROM query_embedding)
                ) as score
            FROM filtered_papers p
            WHERE score IS NOT NULL
            ORDER BY score ASC
            LIMIT ${limit}
        `
    } else {
        sql = `
            WITH filtered_papers AS (
                SELECT id, ${column}
                FROM datatable 
                ${categoryConditions}
            )
            SELECT 
                p.id,
                p.${column},
                fts_main_datatable.match_bm25(
                    id, 
                    '${searchQuery}',
                    fields := '${column}'
                ) as score
            FROM filtered_papers p
            WHERE score IS NOT NULL
            ORDER BY score DESC
            LIMIT ${limit}
        `
    }

    return sql
}

const vectorToArray = (vector: Vector): Array<unknown> => {
    const newArray = new Array<unknown>(vector.length)
    for (let i = 0; i < vector.length; i++) {
        const value = vector.get(i)
        newArray[i] = value
    }
    return newArray
}

const isVector = (value: unknown): boolean => {
    return value instanceof Vector
}

const convertArrowDataToJS = (table: Table): RowData[] => {
    const rows: RowData[] = Array.from({ length: table.numRows }, () => ({}))

    for (const field of table.schema.fields) {
        for (const batch of table.batches) {
            const column = batch.getChild(field.name)
            if (column) {
                for (let i = 0; i < batch.numRows; i++) {
                    const value = column.get(i)

                    let castedValue
                    switch (typeof value) {
                        case 'number':
                            castedValue = value
                            break
                        case 'string':
                            castedValue = value
                            break
                        case 'boolean':
                            castedValue = value
                            break
                        case 'object':
                            if (!isVector(value) && value !== null) {
                                throw Error(
                                    `Unsupported arrow type, failed to cast cell at column ${field.name} row ${i} of current batch`
                                )
                            }
                            if (value === null) {
                                castedValue = value
                                break
                            }

                            castedValue = vectorToArray(value)
                            break
                        default:
                            castedValue = value
                            break
                    }

                    rows[i][field.name] = castedValue
                }
            }
        }
    }
    return rows
}

function transformResults(result: arrow.Table): RowData[] {
    const rowData = convertArrowDataToJS(result)
    return rowData
}

const getUniqueCategories = async (
    db: AsyncDuckDB,
    dataSource: string,
    categoryColumn: string = 'categories'
): Promise<string[]> => {
    const conn = await db.connect()
    try {
        const result = await conn.query(`
            WITH RECURSIVE 
            category_arrays AS (
                SELECT DISTINCT ${categoryColumn} as cats
                FROM read_parquet('${dataSource}')
            ),
            unnested_categories AS (
                SELECT DISTINCT unnest(cats) as category
                FROM category_arrays
                WHERE cats IS NOT NULL
            )
            SELECT category
            FROM unnested_categories
            ORDER BY category;
        `)

        const categories = result.getChild('category')
        if (categories) {
            return vectorToArray(categories) as string[]
        }
        return []
    } finally {
        await conn.close()
    }
}

const splitCategories = (
    categories: string[]
): {
    popularCategories: { id: string; name: string }[]
    additionalCategories: { id: string; name: string }[]
} => {
    const categoryObjects = categories.map((category) => ({
        id: category,
        name: category,
    }))

    const popularCategories = categoryObjects.slice(
        0,
        NUMBER_POPULAR_CATEGORIES
    )
    const additionalCategories = categoryObjects.slice(
        NUMBER_POPULAR_CATEGORIES
    )

    return { popularCategories, additionalCategories }
}

const loadModel = async (
    model: Model,
    progress_callback: (data: WorkerProgressCallbackData) => void
): Promise<FeatureExtractionPipeline> => {
    let options: PretrainedModelOptions = {
        progress_callback: progress_callback as ProgressCallback,
    }

    switch (model.type) {
        case ModelType.ArcticEmbedLarge:
            options = {
                ...options,
            }
            break
        case ModelType.MiniLM:
            options = {
                ...options,
            }
            break
        /*case ModelType.IntFLoat:
            options = {
                ...options,
            }
            break
        */
        case ModelType.ArcticEmbedMedium:
            options = {
                ...options,
            }
            break
        default:
            throw new Error('Unsupported model type')
    }

    const extractor = await pipeline('feature-extraction', model.type, options)
    return extractor as FeatureExtractionPipeline
}

/**
 * Send inference message to worker and wait on response
 * */
const sendInferDataToWorker = (
    inferenceInput: ReceiverInferData,
    worker: Worker
): Promise<{ type: 'infer'; data: WorkerInferData }> => {
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data)
        worker.onerror = (error) => reject(error)
        worker.postMessage({ type: 'infer', data: inferenceInput })
    })
}

const inferEmbedding = async (
    text: string,
    worker: Worker
): Promise<number[]> => {
    const response = await sendInferDataToWorker({ text: text }, worker)
    const data = response.data as WorkerInferData
    return data.output
}

const validateParquetSchema = async (
    file: File,
    embeddingDimension: number
): Promise<void> => {
    const fileBuffer = await file.arrayBuffer()

    let table: arrow.Table
    try {
        const arrowTable = readParquet(new Uint8Array(fileBuffer))
        table = arrow.tableFromIPC(arrowTable.intoIPCStream())
    } catch (error) {
        throw new Error(`Failed to read Parquet file: ${error}`)
    }

    const schema = table.schema

    const expectedSchema: Record<string, string> = {
        id: 'utf8',
        content: 'utf8',
        embedding: `fixedsizelist[${embeddingDimension}]<float32>`,
        categories: 'list<utf8>',
    }

    for (const [expectedField, expectedType] of Object.entries(
        expectedSchema
    )) {
        const field = schema.fields.find((f) => f.name === expectedField)
        if (!field) {
            throw new Error(`Field '${expectedField}' not found in schema`)
        }

        const actualType = field.type.toString().toLowerCase()
        if (!actualType.includes(expectedType)) {
            throw new Error(
                `Field '${expectedField}' has type '${actualType}', expected '${expectedType}'`
            )
        }
    }
}

// Custom fetch function to track download progress
const createProgressTrackingFetch = (
    onProgress?: (progress: { loaded: number; total: number | null }) => void
): typeof fetch => {
    return async (input, init) => {
        const response = await fetch(input, init)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        if (!response.body) {
            throw new Error('Response body is not available')
        }

        const contentLength = response.headers.get('Content-Length')
        const total = contentLength ? parseInt(contentLength, 10) : null
        let loaded = 0

        const reader = response.body.getReader()
        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        controller.close()
                        break
                    }
                    loaded += value.byteLength
                    if (onProgress) {
                        onProgress({ loaded, total })
                    }
                    controller.enqueue(value)
                }
            },
        })

        return new Response(stream, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
        })
    }
}

const downloadDataset = async (
    repoId: string,
    filepath: string,
    onProgress?: (progress: { loaded: number; total: number | null }) => void
): Promise<File | null> => {
    try {
        // Use the custom fetch function
        const customFetch = createProgressTrackingFetch(onProgress)

        const response = await downloadFile({
            repo: repoId as RepoDesignation,
            path: filepath,
            fetch: customFetch, // Pass the custom fetch
        })

        if (!response?.ok) {
            console.error('Failed to download file:', response?.statusText)
            return null
        }

        const blob = await response.blob()
        const contentDisposition = response.headers.get('Content-Disposition')
        let fileName = filepath.split('/').pop() || 'downloaded_file'
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="([^"]+)"/)
            if (match && match[1]) {
                fileName = match[1]
            }
        }

        const file = new File([blob], fileName, { type: blob.type })
        return file
    } catch (error) {
        console.error('Error downloading dataset:', error)
        return null
    }
}

export {
    validateParquetSchema,
    inferEmbedding,
    sendInferDataToWorker,
    buildAndExecuteSearch,
    vectorToArray,
    loadModel,
    getUniqueCategories,
    splitCategories,
    downloadDataset,
}
