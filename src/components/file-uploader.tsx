import type React from 'react'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { MAX_FILE_SIZE } from '@/lib/const'

type FileUploaderProps = {
    onFileUploaded: (fileName: string, file: File) => void
}

export default function FileUploader({ onFileUploaded }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const validateAndSetFile = (file: File) => {
        setError(null)

        // Check file extension for Parquet
        if (!file.name.toLowerCase().endsWith('.parquet')) {
            setError('Please upload a Parquet file')
            return
        }

        // Check file size (max 10MB)
        if (file.size > MAX_FILE_SIZE) {
            setError('File size should be less than 10MB')
            return
        }

        setFile(file)
    }

    const handleUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setError(null)

        try {
            // Simulate upload delay
            await new Promise((resolve) => setTimeout(resolve, 1500))
            // Call onFileUploaded directly
            await onFileUploaded(file.name, file) // Ensure this is awaited if it returns a Promise
            setIsSuccess(true)
        } catch (err) {
            setError(`An error occurred while uploading the file: ${err}`)
            setIsSuccess(false)
        } finally {
            setIsUploading(false)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isSuccess ? (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                        File uploaded successfully!
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    <Card
                        className={`border-2 border-dashed ${
                            isDragging
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/20'
                        } transition-colors duration-200`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                Upload your data file
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Drag and drop your file here, or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground mb-6">
                                Supports Parquet files only (max 10MB)
                            </p>
                            <Button
                                variant="outline"
                                onClick={triggerFileInput}
                            >
                                Browse Files
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".parquet"
                            />
                        </CardContent>
                    </Card>

                    {file && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center">
                                <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
