import { test, expect, describe, it, mock } from 'bun:test'
import { vectorToArray } from '@/lib/utils'
import * as arrow from 'apache-arrow'
import { downloadDataset } from '@/lib/utils' // Adjust the import path as needed
import { downloadFile } from '@huggingface/hub'

// Mock the downloadFile function for mock tests
const mockDownloadFile = mock(downloadFile)

// Helper function to log debug information
const debugLog = (...args: any[]) => {
    if (!process.env.CI || process.env.DEBUG_TESTS) {
        console.log(...args)
    }
}

describe('vectorToArray', () => {
    it('float32 array', () => {
        const array = new Float32Array([1, 2, 3])
        const vector = arrow.makeVector(array)
        expect(vectorToArray(vector)).toEqual([1, 2, 3])
    })
})

describe('test_downloadDataset', () => {
    it('download and parse real config.json from Hugging Face', async () => {
        // Skip test in CI environment
        if (process.env.CI && !process.env.DEBUG_TESTS) {
            console.log(
                'Skipping non-mock config.json download and parsing test in CI'
            )
            return
        }

        // Use a real, small public dataset file from Hugging Face
        const repo = 'hf-internal-testing/tiny-random-bert'
        const filepath = 'config.json'
        debugLog(
            `Downloading config.json from repo: ${repo}, filepath: ${filepath}`
        )

        let result: File | null = null
        try {
            result = await downloadDataset(repo, filepath)
        } catch (error) {
            debugLog('Download error:', error)
            throw new Error(`Failed to download config.json: ${error}`)
        }

        // Verify the downloaded file
        expect(result).toBeInstanceOf(File)
        expect(result?.name).toBe('config.json')
        expect(result?.type).toContain('text/plain;charset=utf-8')
        expect(result?.size).toBeGreaterThan(0)
        debugLog('Downloaded file details:', {
            name: result?.name,
            type: result?.type,
            size: result?.size,
        })

        let text: string
        try {
            const t = await result?.text()
            if (!t) {
                throw new Error('can not get content of file')
            }
            text = t
            debugLog('Real config.json text content:', text)
        } catch (error) {
            debugLog('Text read error:', error)
            throw new Error(`Failed to read config.json text: ${error}`)
        }

        let parsedConfig: { [key: string]: number | string | boolean | null }

        try {
            parsedConfig = JSON.parse(text)
            debugLog('Real parsed config:', parsedConfig)
        } catch (error) {
            debugLog('Real parsing error:', error)
            throw new Error(`Failed to parse config.json: ${error}`)
        }

        // Assert the parsed content (specific to tiny-random-bert)
        expect(parsedConfig).toBeInstanceOf(Object)
        expect(parsedConfig.model_type).toBeDefined()
        expect(parsedConfig.hidden_size).toBeDefined()
        expect(parsedConfig.num_attention_heads).toBeDefined()
        expect(parsedConfig.num_hidden_layers).toBeDefined()
        expect(parsedConfig.vocab_size).toBeDefined()
    })
})
