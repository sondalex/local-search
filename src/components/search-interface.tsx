'use client'

import { useEffect, useState } from 'react'
import { ErrorBox } from './ui/error'
import { Progress } from './ui/progress'
import { AsyncDuckDB, DuckDBDataProtocol } from '@duckdb/duckdb-wasm'
import { useDuckDB } from '@/context/context'
import { buildAndExecuteSearch, inferEmbedding } from '@/lib/utils'
import { RowData } from '@/lib/types'
import { SearchFilters } from '@/components/search/searchFilters'
import { SearchBar } from '@/components/search/searchBar'
import { DataSourceIndicator } from '@/components/search/dataSourceIndicator'
import { FileUploadModal } from '@/components/search/fileUploadModal'
import SearchResults from '@/components/search-results'
import {
    getUniqueCategories,
    splitCategories,
    validateParquetSchema,
} from '@/lib/utils'
import { useWorker } from '@/hooks/Worker'
import { useCallback } from 'react'
import wasmInit from 'parquet-wasm'

import {
    Model,
    ReceiverLoadData,
    WorkerLoadData,
    WorkerProgressCallbackData,
} from '@/lib/types'
import {
    SEARCH_COLUMN,
    VECTOR_EMBEDDING_COLUMN,
    CATEGORY_COLUMN,
} from '@/lib/const'

interface Category {
    id: string
    name: string
}

type ProgressData = {
    progress?: number
    name: string
    file?: string
}

interface Categories {
    popularCategories: Category[]
    additionalCategories: Category[]
}

interface SearchInterfaceProps {
    model: Model
}

export default function SearchInterface({ model }: SearchInterfaceProps) {
    const { db } = useDuckDB()
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [categories, setCategories] = useState<Categories | undefined>(
        undefined
    )
    const [isUploaded, setIsUploaded] = useState<boolean>(false)
    const [searchResults, setSearchResults] = useState<RowData[]>([])
    const [showUploader, setShowUploader] = useState(false)
    const [dataSource, setDataSource] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [useSemanticSearch, setUseSemanticSearch] = useState(false)
    const [modelIsLoaded, setModelIsLoaded] = useState<boolean>(false)
    const [modelIsLoading, setModelIsLoading] = useState<boolean>(false)
    const [progressItems, setProgressItems] = useState<ProgressData[]>([])

    const worker = useWorker((e) => handleWorkerMessage(e)).worker

    useEffect(() => {
        if (!modelIsLoaded) {
            const data: ReceiverLoadData = {
                model: model,
            }
            setModelIsLoading(true)
            worker.current?.postMessage({ type: 'load', data: data })
        }
    }, [modelIsLoaded, worker, model])
    useEffect(() => {
        const initializeParquetReader = async () => {
            try {
                await wasmInit()
            } catch (error) {
                console.error(
                    'Failed to initialize WebAssembly Parquet Reader:',
                    error
                )
            }
        }
        initializeParquetReader()
    }, [])

    const updateCategories = async (dataSource: string) => {
        if (!db) return
        try {
            const uniqueCategories = await getUniqueCategories(
                db,
                dataSource,
                CATEGORY_COLUMN
            )
            const { popularCategories, additionalCategories } =
                splitCategories(uniqueCategories)
            setCategories({ popularCategories, additionalCategories })
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch categories'
            )
        }
    }

    const handleSearch = useCallback(
        async (query: string) => {
            setSearchQuery(query)
            if (!dataSource || !db || !worker.current) {
                setError('Missing required fields or worker not initialized')
                return
            }

            setIsSearching(true)
            setError(null)

            try {
                let embedding
                if (useSemanticSearch) {
                    embedding = await inferEmbedding(query, worker.current)
                }

                const results = await buildAndExecuteSearch(
                    db,
                    {
                        searchQuery: query,
                        selectedCategories,
                        dataSource,
                        useSemanticSearch,
                        embedding,
                        column: SEARCH_COLUMN,
                        vectorEmbeddingColumn: VECTOR_EMBEDDING_COLUMN,
                        model: model,
                    },
                    { limit: 100 }
                )
                setSearchResults(results)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Search failed')
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        },
        [model, dataSource, db, useSemanticSearch, selectedCategories, worker]
    )
    const handleFileUploaded = async (
        db: AsyncDuckDB,
        fileName: string,
        file: File
    ) => {
        try {
            await validateParquetSchema(file, model.dimension)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Invalid Parquet schema'
            )
            setIsSearching(false)
            setShowUploader(false)
            return
        }

        try {
            setError(null)
            setIsSearching(true)
            setIsUploaded(true)

            if (!db) {
                throw new Error('Database not initialized')
            }

            await db.registerFileHandle(
                fileName,
                file,
                DuckDBDataProtocol.BROWSER_FILEREADER,
                true
            )

            setDataSource(fileName)
            await updateCategories(fileName)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to process Parquet file'
            )
            setIsUploaded(false)
        } finally {
            setIsSearching(false)
            setShowUploader(false)
        }
    }

    const handleProgress = (data: WorkerProgressCallbackData) => {
        switch (data.status) {
            case 'initiate':
                setProgressItems((prevItems: ProgressData[]) => {
                    const exists = prevItems.some(
                        (item) => item.file === data.file
                    )
                    if (!exists) {
                        return [
                            ...prevItems,
                            {
                                file: data.file,
                                name: data.status,
                            },
                        ]
                    }
                    return prevItems
                })
                break

            case 'progress':
                setProgressItems((prevItems: ProgressData[]) => {
                    const updatedItems = prevItems.map((item) => {
                        if (item.file === data.file) {
                            return { ...item, progress: data.progress }
                        }
                        return item
                    })
                    return updatedItems
                })
                break

            case 'done':
                setProgressItems((prev) =>
                    prev.filter((item) => item.file !== data.file)
                )
                break

            case 'ready':
                break
        }
    }

    const handleLoad = (data: WorkerLoadData) => {
        if (data.loaded) {
            setModelIsLoaded(true)
            setModelIsLoading(false)
        }
    }

    const handleWorkerMessage = (event: MessageEvent) => {
        const type = event.data.type
        const data = event.data.data

        switch (type) {
            case 'progress':
                handleProgress(data as WorkerProgressCallbackData)
                break
            case 'load':
                handleLoad(data as WorkerLoadData)
                break
            case 'infer':
                // The logic is managed elsewhere already
                break
            default:
                break
        }
    }

    return (
        <div>
            {modelIsLoading ? (
                <div>
                    {progressItems.map((data) => {
                        return (
                            <div key={data.file}>
                                <label>{data.file}</label>
                                <Progress value={data.progress} />
                            </div>
                        )
                    })}
                </div>
            ) : modelIsLoaded ? (
                <div className="space-y-6">
                    {categories && (
                        <SearchFilters
                            popularCategories={categories.popularCategories}
                            additionalCategories={
                                categories.additionalCategories
                            }
                            selectedCategories={selectedCategories}
                            onToggleCategory={(categoryId) =>
                                setSelectedCategories((prev) =>
                                    prev.includes(categoryId)
                                        ? prev.filter((id) => id !== categoryId)
                                        : [...prev, categoryId]
                                )
                            }
                            categoryColumn={CATEGORY_COLUMN}
                        />
                    )}

                    <DataSourceIndicator
                        dataSource={dataSource}
                        onClear={() => setDataSource(null)}
                    />
                    <div></div>

                    <SearchBar
                        useSemanticSearch={useSemanticSearch}
                        isSearching={isSearching}
                        modelName={model.type}
                        onSearchTypeChange={setUseSemanticSearch}
                        onSearch={handleSearch}
                        onUpload={() => setShowUploader(true)}
                        uploadDisabled={false}
                        searchDisabled={!isUploaded}
                    />

                    {error && <ErrorBox error={error} />}

                    {isUploaded && (
                        <SearchResults
                            results={searchResults}
                            isLoading={isSearching}
                            searchQuery={searchQuery}
                            column={SEARCH_COLUMN}
                        />
                    )}

                    <FileUploadModal
                        show={showUploader}
                        onClose={() => setShowUploader(false)}
                        onFileUploaded={handleFileUploaded}
                        db={db as AsyncDuckDB}
                        modelID={model.type}
                    />
                </div>
            ) : null}
        </div>
    )
}
