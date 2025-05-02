import SearchInterface from '@/components/search-interface'
import { DuckDBProvider } from '@/context/DuckDB'
import ModelSelector from '@/components/modelSelector'
import { useState } from 'react'
import { Model } from '@/lib/types'

export default function App() {
    const [model, setModel] = useState<Model | null>(null)

    const handleOnModelSelect = (model: Model) => {
        setModel(model)
    }
    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">
                Semantic Search
            </h1>
            <DuckDBProvider>
                {model ? (
                    <SearchInterface model={model} />
                ) : (
                    <ModelSelector
                        onModelSelect={handleOnModelSelect}
                    ></ModelSelector>
                )}
            </DuckDBProvider>
        </main>
    )
}
