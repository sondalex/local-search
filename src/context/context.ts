import { useContext } from 'react'
import { DuckDBContext, DuckDBContextType } from './DuckDB'
import { ExpectedSchemaContext, ExpectedSchemaType } from './ExpectedSchema'

const useDuckDB = (): DuckDBContextType => useContext(DuckDBContext)

const useExpectedSchema = (): ExpectedSchemaType =>
    useContext(ExpectedSchemaContext)

export { useDuckDB, useExpectedSchema }
