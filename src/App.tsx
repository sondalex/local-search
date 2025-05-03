import SearchInterface from '@/components/search-interface'
import { DuckDBProvider } from '@/context/DuckDB'
import ModelSelector from '@/components/modelSelector'
import { useState } from 'react'
import { Model } from '@/lib/types'
import Footer from './components/footer'
import { ThemeProvider } from './context/Theme'

export default function App() {
    const [model, setModel] = useState<Model | null>(null)

    const handleOnModelSelect = (model: Model) => {
        setModel(model)
    }
    return (
        <div className="min-h-screen flex flex-col">
            <ThemeProvider>
                <main className="container mx-auto px-4 py-8 flex-grow">
                    <h1 className="text-3xl font-bold mb-8 text-center">
                        Local Search
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
                <Footer githubURL="https://github.com/sondalex/local-search"></Footer>
            </ThemeProvider>
        </div>
    )
}
