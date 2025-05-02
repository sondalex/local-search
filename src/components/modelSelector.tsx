'use client'

import { useState } from 'react'
import { Cpu, Check, ExternalLink } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Model } from '@/lib/types'

import { SEMANTIC_MODELS } from '@/lib/const'

type ModelSelectorProps = {
    onModelSelect: (model: Model) => void
}

export default function ModelSelector({ onModelSelect }: ModelSelectorProps) {
    const [hoveredModel, setHoveredModel] = useState<string | null>(null)

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-primary" />
                        <CardTitle>Select a Semantic Search Model</CardTitle>
                    </div>
                    <CardDescription>
                        Choose a model that best fits your semantic search
                        needs. Different models have different strengths and
                        performance characteristics.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SEMANTIC_MODELS.map((model) => {
                    const info = model.info
                    if (!info) {
                        return
                    }
                    return (
                        <Card
                            key={model.type}
                            className={`border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                                hoveredModel === model.type
                                    ? 'border-primary shadow-md'
                                    : `${info.color} border-opacity-50`
                            }`}
                            onMouseEnter={() => setHoveredModel(model.type)}
                            onMouseLeave={() => setHoveredModel(null)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-2xl"
                                            aria-hidden="true"
                                        >
                                            {info.icon}
                                        </span>
                                        <CardTitle
                                            className={`text-lg ${info.accentColor}`}
                                        >
                                            {info.name}
                                        </CardTitle>
                                    </div>
                                </div>
                                <CardDescription>
                                    {info.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="space-y-2">
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">
                                            Strengths
                                        </h4>
                                        <ul className="text-sm space-y-1">
                                            {info.strengths.map(
                                                (strength, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-start"
                                                    >
                                                        <Check className="h-3.5 w-3.5 mr-1.5 mt-0.5 text-green-500" />
                                                        <span className="text-muted-foreground">
                                                            {strength}
                                                        </span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">
                                            Limitations
                                        </h4>
                                        <ul className="text-sm space-y-1">
                                            {info.weaknesses.map(
                                                (weakness, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-start"
                                                    >
                                                        <span className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex items-center justify-center text-amber-500">
                                                            •
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {weakness}
                                                        </span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">
                                            Dimension of embeddings
                                        </h4>
                                        <p className="text-sm font-bold">
                                            {model.dimension}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="flex flex-col">
                                    <a target="_blank" href={info.modelCard}>
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                    </a>
                                    <Button
                                        onClick={() => {
                                            const value =
                                                SEMANTIC_MODELS.filter(
                                                    (semantic_model) =>
                                                        semantic_model.type ==
                                                        model.type
                                                )
                                            onModelSelect(value[0])
                                        }}
                                        className="w-full mt-2"
                                        variant={
                                            hoveredModel === model.type
                                                ? 'default'
                                                : 'outline'
                                        }
                                    >
                                        Select {info.name}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
