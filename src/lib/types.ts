enum ModelType {
    MiniLM = 'Xenova/all-MiniLM-L6-v2',
    ArcticEmbedMedium = 'Snowflake/snowflake-arctic-embed-m-v2.0',
    // IntFLoat = 'intfloat/e5-base-v2',
    ArcticEmbedLarge = 'Snowflake/snowflake-arctic-embed-l-v2.0',
}

interface ReceiverLoadData {
    model: Model
}

interface WorkerInferData {
    output: number[]
}

interface ReceiverInferData {
    text: string
}

interface WorkerLoadData {
    loaded: boolean
    modelType: ModelType
}

interface ModelInfo {
    name: string
    description: string
    strengths: string[]
    weaknesses: string[]
    icon: string
    color: string
    accentColor: string
    modelCard: string
}

interface Model {
    type: ModelType
    dimension: number
    info?: ModelInfo
}

interface Field {
    name: string
    description: string
    /*Data type*/
    dtype: string
}

type status = 'initiate' | 'progress' | 'done' | 'ready'

interface WorkerProgressCallbackData {
    status: status
    name?: string
    file?: string
    progress?: number
    loaded?: number
    total?: number
    task?: 'feature-extraction'
    model?: string
}
interface RowData {
    [key: string]: number | string | boolean | null | unknown[]
}

export type {
    ReceiverInferData,
    ReceiverLoadData,
    WorkerInferData,
    WorkerLoadData,
    WorkerProgressCallbackData,
    Model,
    RowData,
    Field,
}

export { ModelType }
