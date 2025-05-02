import { useRef, useCallback, useEffect, useState } from 'react'

const useWorker = (onMessage: (e: MessageEvent) => void) => {
    const workerRef = useRef<Worker | null>(null)
    const [error, setError] = useState<Error | null>(null)

    const stableOnMessage = useCallback(onMessage, [])

    useEffect(() => {
        try {
            if (!workerRef.current) {
                workerRef.current = new Worker(
                    new URL('@/lib/workers/worker.ts', import.meta.url),
                    {
                        type: 'module',
                    }
                )
            }

            const worker = workerRef.current
            worker.addEventListener('message', stableOnMessage)
            worker.addEventListener('error', (e) => {
                setError(new Error(`Worker error: ${e.message}`))
            })

            return () => {
                worker.removeEventListener('message', stableOnMessage)
                worker.removeEventListener('error', (e) => {
                    setError(new Error(`Worker error: ${e.message}`))
                })
                worker.terminate()
                workerRef.current = null
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err
                    : new Error('Failed to initialize worker')
            )
        }
    }, [stableOnMessage])

    return { worker: workerRef, error }
}

export { useWorker }
