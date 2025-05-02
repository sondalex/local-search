import { createContext, ReactNode } from 'react'
import { Field } from '@/lib/types'

interface ExpectedSchemaType {
    fields: Field[]
}

const ExpectedSchemaContext = createContext<ExpectedSchemaType>({
    fields: [],
})

const DEFAULT_FIELDS: Field[] = [
    {
        name: 'id',
        description: 'Unique document identifier',
        dtype: 'string',
    },
    {
        name: 'content',
        description: 'Full text content',
        dtype: 'string',
    },
    {
        name: 'categories',
        description: 'Document categories',
        dtype: 'string[]',
    },
    // TODO: Dynamically set the dimension
    {
        name: 'embedding',
        description: 'Document embedding',
        dtype: 'float[384]',
    },
]

interface ExpectedSchemaProviderProps {
    fields?: Field[]
    children: ReactNode
}

const ExpectedSchemaProvider: React.FC<ExpectedSchemaProviderProps> = ({
    fields,
    children,
}) => {
    const expected = { fields: fields ? fields : DEFAULT_FIELDS }
    return (
        <ExpectedSchemaContext.Provider value={expected}>
            {children}
        </ExpectedSchemaContext.Provider>
    )
}

export { ExpectedSchemaContext, ExpectedSchemaProvider }

export type { ExpectedSchemaType }
