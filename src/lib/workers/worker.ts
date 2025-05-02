import { FeatureExtractionPipeline, Tensor } from '@huggingface/transformers'
import { loadModel } from '@/lib/utils'
import { Model, WorkerProgressCallbackData } from '@/lib/types'
import {
    ReceiverInferData,
    ReceiverLoadData,
    WorkerInferData,
    WorkerLoadData,
} from '../types'

class Pipeline {
    model: FeatureExtractionPipeline | null
    constructor() {
        this.model = null
        self.addEventListener('message', this.handleMessage.bind(this))
    }

    async loadModel(
        model: Model,
        progressCallback: (data: WorkerProgressCallbackData) => void
    ) {
        console.log(`Loading Model ${model.type}`)
        const extractor = await loadModel(model, progressCallback)
        this.model = extractor
    }

    progressCallback(data: WorkerProgressCallbackData) {
        self.postMessage({ type: 'progress', data: data })
    }

    async handleMessage(event: MessageEvent) {
        switch (event.data.type) {
            case 'load': {
                const data = event.data.data as ReceiverLoadData
                await this.loadModel(data.model, this.progressCallback)
                const workerData = {
                    loaded: true,
                    modelType: data.model.type,
                } as WorkerLoadData
                const message = {
                    type: 'load',
                    data: workerData,
                }
                self.postMessage(message)
                break
            }
            case 'infer': {
                const model = this.model
                const data = event.data.data as ReceiverInferData
                if (!model) {
                    break
                }
                const output: Tensor = await model(data.text, {
                    pooling: 'mean',
                    normalize: true,
                })
                const workerData = {
                    output: output.tolist()[0],
                } as WorkerInferData

                const message = {
                    type: 'infer',
                    data: workerData,
                }
                self.postMessage(message)
                break
            }
            default:
                break
        }
    }
}

new Pipeline()
