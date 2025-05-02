import React, { createContext, useEffect, useState, ReactNode } from 'react'
import { setupDuckDB } from '@/lib/db'
import * as duckdb from '@duckdb/duckdb-wasm'

interface DuckDBContextType {
    db: duckdb.AsyncDuckDB | null
    error?: string | null
}

const DuckDBContext = createContext<DuckDBContextType>({
    db: null,
    error: null,
})

interface DuckDBProviderProps {
    children: ReactNode
}

const DuckDBProvider: React.FC<DuckDBProviderProps> = ({ children }) => {
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        async function initializeDatabase() {
            try {
                setIsLoading(true)
                const dbInstance = await setupDuckDB()
                const conn = await dbInstance.connect()
                await conn.query('INSTALL vss; LOAD vss;')
                await conn.query('INSTALL fts; LOAD fts;')
                await conn.close()
                setDb(dbInstance)
            } catch (err) {
                console.error('Failed to initialize DuckDB:', err)
                setError('Failed to initialize database')
            } finally {
                setIsLoading(false)
            }
        }
        initializeDatabase()
    }, [])

    if (error) {
        return <div>Error: {error}</div>
    }

    if (!db || isLoading) {
        return <div>Loading database...</div>
    }

    return (
        <DuckDBContext.Provider value={{ db, error }}>
            {children}
        </DuckDBContext.Provider>
    )
}

export { DuckDBProvider, DuckDBContext }
export type { DuckDBContextType }
