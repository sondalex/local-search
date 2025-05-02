import { Search, Network, FileUp, HelpCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { useExpectedSchema } from '@/context/context'
import { ExpectedSchemaProvider } from '@/context/ExpectedSchema'

interface SearchToolTipProps {
    modelName: string
}

const SearchToolTip = ({ modelName }: SearchToolTipProps) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Model</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                    <p className="text-sm">{modelName}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const SchemaInfo: React.FC = () => {
    const { fields } = useExpectedSchema()
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted cursor-pointer">
                        <HelpCircle className="h-4 w-4" />
                        <span className="sr-only">Data Schema Info</span>
                    </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                    <div className="text-sm">
                        <p className="font-semibold mb-1">
                            Expected Data Schema:
                        </p>
                        <p className="mb-1">Your data file should include:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            {fields.map((field) => (
                                <li>{`${field.name}: ${field.description}`}</li>
                            ))}
                        </ul>
                        <p className="mt-1 text-xs">
                            Click "Upload" for full schema details
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

interface SearchBarProps {
    useSemanticSearch: boolean
    isSearching: boolean
    modelName: string
    onSearchTypeChange: (useSemanticSearch: boolean) => void
    /**
     * @param e - The form event triggered by submitting the search form.
     * @param searchInputFieldName - The name of the input field that contains the inputted search query
     **/
    onSearch: (query: string) => void
    onUpload: () => void
    uploadDisabled?: boolean
    searchDisabled?: boolean
}

const SearchBar: React.FunctionComponent<SearchBarProps> = ({
    useSemanticSearch,
    isSearching,
    onSearchTypeChange,
    onSearch,
    onUpload,
    uploadDisabled,
    searchDisabled,
    modelName,
}) => {
    const searchInputFieldName: string = 'query'

    const handleFormSubmission = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const query =
            formData.get(searchInputFieldName)?.toString().trim() || ''
        onSearch(query)
    }
    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={useSemanticSearch ? 'outline' : 'default'}
                            onClick={() => onSearchTypeChange(false)}
                            className="relative"
                            size="sm"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            BM25 Search
                        </Button>
                        <Button
                            variant={useSemanticSearch ? 'default' : 'outline'}
                            onClick={() => onSearchTypeChange(true)}
                            className="relative"
                            size="sm"
                        >
                            <Network className="w-4 h-4 mr-2" />
                            Semantic Search
                        </Button>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                    {useSemanticSearch ? (
                        <p>
                            Semantic search understands the meaning behind your
                            query and finds conceptually similar documents.
                        </p>
                    ) : (
                        <p>
                            BM25 search finds documents containing your exact
                            keywords and similar terms.
                        </p>
                    )}
                </div>
            </div>

            <form
                onSubmit={handleFormSubmission}
                className="flex w-full items-center space-x-2"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        name={searchInputFieldName}
                        disabled={searchDisabled}
                        placeholder={
                            useSemanticSearch
                                ? 'Search semantically...'
                                : 'Search with keywords...'
                        }
                        className="pl-10"
                    />
                </div>
                <div>
                    <div className="flex flex-row space-x-2 items-center">
                        <SearchToolTip modelName={modelName} />
                        <Button
                            type="submit"
                            disabled={isSearching || searchDisabled}
                        >
                            <span>
                                {isSearching ? 'Searching...' : 'Search'}
                            </span>
                        </Button>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onUpload}
                    disabled={uploadDisabled}
                >
                    <FileUp className="w-4 h-4 mr-2" />
                    <div className="flex flex-row space-x-2 items-center">
                        <span>Upload</span>
                        <ExpectedSchemaProvider>
                            <SchemaInfo />
                        </ExpectedSchemaProvider>
                    </div>
                </Button>
            </form>
        </div>
    )
}

export { SearchBar, SchemaInfo }
