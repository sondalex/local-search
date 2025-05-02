import { Button } from '@/components/ui/button'
import FileUploader from '@/components/file-uploader'
import { AsyncDuckDB } from '@duckdb/duckdb-wasm'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useExpectedSchema } from '@/context/context'
import { TabsTrigger, TabsContent, TabsList, Tabs } from '@/components/ui/tabs'
import { ExpectedSchemaProvider } from '@/context/ExpectedSchema'
import { downloadDataset } from '@/lib/utils'
import { ModelType } from '@/lib/types'
import { DATASET_REPO_ID } from '@/lib/const'
import { Progress } from '../ui/progress'
import { useState } from 'react'
import { ErrorBox } from '../ui/error'

interface FileUploadModalProps {
    show: boolean
    onClose: () => void
    modelID: ModelType
    onFileUploaded: (
        db: AsyncDuckDB,
        fileName: string,
        file: File
    ) => Promise<void>
    db: AsyncDuckDB
}

const ExpectedSchemaTable = () => {
    const { fields } = useExpectedSchema()
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="font-bold text-base">
                        Column Name
                    </TableHead>
                    <TableHead className="font-bold text-base">
                        Data Type
                    </TableHead>
                    <TableHead className="font-bold text-base">
                        Description
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {fields.map((field) => (
                    <TableRow>
                        <TableCell className="font-medium font-bold">
                            {field.name}
                        </TableCell>
                        <TableCell>{field.dtype}</TableCell>
                        <TableCell>{field.description}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export function FileUploadModal({
    show,
    onClose,
    onFileUploaded,
    db,
    modelID,
}: FileUploadModalProps) {
    const [progress, setProgress] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    if (!show) return null

    const handleOnArXivExample = async () => {
        let filepath: string
        let fileName: string
        switch (modelID) {
            case ModelType.MiniLM:
                filepath = 'data/arxiv-abstract-minilm.parquet'
                fileName = 'arxiv-abstract-minilm.parquet'
                break
            case ModelType.ArcticEmbedMedium:
                filepath = 'data/arxiv-abstract-arcticmedium.parquet'
                fileName = 'arxiv-abstract-arcticmedium.parquet'
                break
            case ModelType.ArcticEmbedLarge:
                filepath = 'data/arxiv-abstract-arcticlarge.parquet'
                fileName = 'arxiv-abstract-arcticlarge.parquet'
                break
            default:
                throw new Error('Invalid model ID')
        }

        const repoID = DATASET_REPO_ID

        try {
            const file = await downloadDataset(
                `datasets/${repoID}`,
                filepath,
                (progressInfo) => {
                    // Calculate progress percentage (0-100)
                    const percentage = progressInfo.total
                        ? Math.min(
                              100,
                              Math.round(
                                  (progressInfo.loaded / progressInfo.total) *
                                      100
                              )
                          )
                        : 0 // Use 0 if total is unknown
                    setProgress(percentage)
                }
            )

            if (!file) {
                setError('Download error')
                throw new Error('Download error')
            }

            setProgress(null)
            setError(null)
            onFileUploaded(db, fileName, file)
        } catch (error) {
            setError('Error downloading ArXiv example')
            console.error('Error downloading ArXiv example:', error)
            setProgress(null)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
                <Tabs defaultValue="upload">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">Upload File</TabsTrigger>
                        <TabsTrigger value="schema">
                            Expected Schema
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload">
                        <h2 className="text-xl font-bold mb-4">Upload Data</h2>
                        <FileUploader
                            onFileUploaded={(fileName: string, file: File) =>
                                onFileUploaded(db, fileName, file)
                            }
                        />
                        <div className="space-y-3">
                            <div className="flex items-center justify-center">
                                <span className="text-lg font-semibold text-muted-foreground px-2">
                                    or
                                </span>
                            </div>
                            <div className="flex gap-2 space-y-3 flex-col">
                                <Button
                                    variant="outline"
                                    onClick={handleOnArXivExample}
                                    className="flex-1 text-xs"
                                    type="button"
                                    disabled={
                                        progress !== null && progress < 100
                                    }
                                >
                                    Download ArXiv Example
                                </Button>
                                {error && <ErrorBox error={error} />}
                                {progress ? (
                                    <Progress
                                        value={progress}
                                        className="w-1/2 mx-auto"
                                    />
                                ) : null}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="mt-4 w-full"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </TabsContent>
                    <TabsContent value="schema">
                        <ExpectedSchemaProvider>
                            <ExpectedSchemaTable />
                        </ExpectedSchemaProvider>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
