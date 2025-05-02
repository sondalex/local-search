import { Github } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

type FooterProps = {
    githubURL: string
    huggingfaceURL?: string
}

export default function Footer({ githubURL, huggingfaceURL }: FooterProps) {
    return (
        <footer className="border-t mt-12 py-6 md:py-0">
            <div className="flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:flex-grow px-10">
                <p className="text-sm text-muted-foreground flex-grow text-center md:text-left">
                    Local Search - Open source project for semantic search
                </p>
                <div className="flex items-center gap-4">
                    {huggingfaceURL && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a
                                        href={huggingfaceURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-5 w-5"
                                        >
                                            <path d="M18.5 16c.5 0 1-.2 1.2-.5 .7-.7 .7-2.7 0-3.5-.2-.2-.7-.5-1.2-.5" />
                                            <path d="M5.5 16c-.5 0-1-.2-1.2-.5-.7-.7-.7-2.7 0-3.5.2-.2.7-.5 1.2-.5" />
                                            <path d="M18.5 9c.5 0 1 .2 1.2.5 .7.7.7 2.7 0 3.5-.2.2-.7.5-1.2.5" />
                                            <path d="M5.5 9c-.5 0-1 .2-1.2.5-.7.7-.7 2.7 0 3.5.2.2.7.5 1.2.5" />
                                            <path d="M12 13.5l.5 .5" />
                                            <path d="M12 10.5l.5-.5" />
                                            <path d="M12 10.5l-.5-.5" />
                                            <path d="M12 13.5l-.5 .5" />
                                            <path d="M16 12c0 2-1.8 3-4 3s-4-1-4-3 1.8-3 4-3 4 1 4 3z" />
                                        </svg>
                                        <span className="sr-only">
                                            Hugging Face Space
                                        </span>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>View on Hugging Face Spaces</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a
                                    href={githubURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Github className="h-5 w-5" />
                                    <span className="sr-only">
                                        GitHub Repository
                                    </span>
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>View GitHub Repository</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </footer>
    )
}
