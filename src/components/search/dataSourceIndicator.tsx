import { FileUp, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface DataSourceIndicatorProps {
    dataSource: string | null
    onClear: () => void
}

export function DataSourceIndicator({
    dataSource,
    onClear,
}: DataSourceIndicatorProps) {
    if (!dataSource) return null

    return (
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-lg">
            <div className="flex items-center">
                <FileUp className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Data source: </span>
                <Badge variant="outline" className="ml-2 px-2">
                    {dataSource}
                </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClear}>
                <X className="w-4 h-4" />
            </Button>
        </div>
    )
}
