import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { RowData } from '@/lib/types'

type SearchResultsProps = {
    results: RowData[]
    isLoading: boolean
    searchQuery: string
    column?: string
}

export default function SearchResults({
    results,
    isLoading,
    searchQuery,
    column,
}: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Searching documents...</p>
            </div>
        )
    }

    if (!results.length) {
        return
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Found {results.length} papers for "{searchQuery}"
            </p>

            {results.map((result) => (
                <ResultCard result={result} column={column} />
            ))}
        </div>
    )
}
function ResultCard({ result, column }: { result: RowData; column?: string }) {
    // Get category color based on first category
    const getCategoryColor = (category: string) => {
        const categoryColors: { [key: string]: string } = {
            cs: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            math: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            physics:
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'q-bio':
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            'q-fin':
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            stat: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            econ: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
        }

        const mainCategory = category.split('.')[0].toLowerCase()
        return (
            categoryColors[mainCategory] ||
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        )
    }

    // Format score for display
    const formatScore = (score: number | undefined) => {
        if (score === undefined) return null
        return `${score.toFixed(1)} relevance`
    }

    const categories = result['categories']

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            {result.score !== undefined && (
                                <Badge
                                    variant="secondary"
                                    className="ml-4 bg-gray-100 dark:bg-gray-800"
                                >
                                    {formatScore(result['score'] as number)}
                                </Badge>
                            )}
                        </div>
                        {column ? (
                            <p className="text-sm text-muted-foreground mb-3">
                                {result[column] as string}
                            </p>
                        ) : null}
                        {categories ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {(categories as string[]).map(
                                    (category: string, index: number) => (
                                        <Badge
                                            key={`${result.id}-${category}-${index}`}
                                            variant="outline"
                                            className={getCategoryColor(
                                                category
                                            )}
                                        >
                                            {category}
                                        </Badge>
                                    )
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
