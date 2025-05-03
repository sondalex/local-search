import { useContext } from 'react'
import { DuckDBContext, DuckDBContextType } from './DuckDB'
import { ExpectedSchemaContext, ExpectedSchemaType } from './ExpectedSchema'
import { ThemeProviderContext } from './Theme'

const useDuckDB = (): DuckDBContextType => useContext(DuckDBContext)

const useExpectedSchema = (): ExpectedSchemaType =>
    useContext(ExpectedSchemaContext)

const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider')

    return context
}

export { useDuckDB, useExpectedSchema, useTheme }
