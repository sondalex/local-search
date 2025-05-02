import { useState } from 'react'
import { Filter, ChevronUp, ChevronDown, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface Category {
    id: string
    name: string
}

interface SearchFiltersProps {
    popularCategories: Category[]
    additionalCategories: Category[]
    selectedCategories: string[]
    onToggleCategory: (categoryId: string) => void
    categoryColumn: string
    onCategoryColumnChange?: (column: string) => void
}

export function SearchFilters({
    popularCategories,
    additionalCategories,
    selectedCategories,
    onToggleCategory,
    categoryColumn,
    onCategoryColumnChange,
}: SearchFiltersProps) {
    const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false)
    const [tempCategoryColumn, setTempCategoryColumn] = useState(categoryColumn)

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filters
                    </h2>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">
                                        Category Settings
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Configure the category column name
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="category-column">
                                            Column
                                        </Label>
                                        <Input
                                            id="category-column"
                                            value={tempCategoryColumn}
                                            onChange={(e) =>
                                                setTempCategoryColumn(
                                                    e.target.value
                                                )
                                            }
                                            className="col-span-2"
                                        />
                                    </div>
                                    {onCategoryColumnChange ? (
                                        <Button
                                            onClick={() =>
                                                onCategoryColumnChange(
                                                    tempCategoryColumn
                                                )
                                            }
                                            className="w-full"
                                        >
                                            Apply
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-medium mb-3">Categories</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {popularCategories.map((category) => (
                                <Badge
                                    key={category.id}
                                    variant={
                                        selectedCategories.includes(category.id)
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className={`px-3 py-1 cursor-pointer hover:bg-primary/90 transition-colors ${
                                        selectedCategories.includes(category.id)
                                            ? ''
                                            : 'hover:text-primary-foreground'
                                    }`}
                                    onClick={() =>
                                        onToggleCategory(category.id)
                                    }
                                >
                                    {category.name}
                                </Badge>
                            ))}
                        </div>

                        <Collapsible
                            open={isMoreCategoriesOpen}
                            onOpenChange={setIsMoreCategoriesOpen}
                            className="mt-2"
                        >
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-0 h-auto text-xs text-muted-foreground"
                                >
                                    {isMoreCategoriesOpen ? (
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                    ) : (
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                    )}
                                    {isMoreCategoriesOpen
                                        ? 'Less categories'
                                        : 'More categories'}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {additionalCategories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={`category-${category.id}`}
                                                checked={selectedCategories.includes(
                                                    category.id
                                                )}
                                                onCheckedChange={() =>
                                                    onToggleCategory(
                                                        category.id
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor={`category-${category.id}`}
                                            >
                                                {category.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
