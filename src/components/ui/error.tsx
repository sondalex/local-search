interface ErrorBoxProps {
    error: string
}

const ErrorBox: React.FC<ErrorBoxProps> = ({ error }) => {
    return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-4 text-sm text-red-600 dark:text-red-400">
            {error}
        </div>
    )
}

export { ErrorBox }
