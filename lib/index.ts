import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { v4 } from 'uuid';
import { Batch } from '../types';

const retryCodes = [408, 500, 502, 504, 522, 524];

export class AxiosBatch {
    client: AxiosInstance;
    headers?: AxiosRequestConfig['headers'];
    baseURL?: AxiosRequestConfig['baseURL'];
    backoffInterval: number;

    /**
     * 
     * @param {Batch.AxiosBatchConstructor} config 
     */
    constructor(config: Batch.AxiosBatchConstructor = {}) {
        const {headers = {}, client, baseURL, backoffInterval } = config;
        this.headers = headers;
        this.client = client || axios.create({ baseURL, headers });
        this.backoffInterval = backoffInterval || 300;
        axiosRetry(this.client, {
            retries: 3,
            retryDelay: (retryCount: number) => {
                return retryCount * this.backoffInterval; // interval for retries
            },
            retryCondition: (error: AxiosError) => {
                const status = error?.response?.status || 500;
                return retryCodes.includes(status);
            }
        });
    }
    /**
     * 
     * @param <number> ms number in ms for the timeout between batches
     */
    private waitFor = (ms: number) => new Promise(r => setTimeout(r, ms));

    private makeBatchUrl = (urls: Batch.BatchUrl[] | string[]): Batch.BatchUrl[] => {
        let cleanBatch = (urls as any).map((item: Batch.BatchUrl | string) => {
            let id;
            let url;
            let method = 'get';
            let data;
            if (typeof item === 'string') {
                id = v4();
                url = item;
            } else {
                id = item.id;
                url = item.url;
                method = item.method || method;
                data = item.data;
            }
            return { id, url, method, data };
        });
        return cleanBatch;
    }

    private getBatchResults = async (batch: Batch.BatchUrl[], headers: Headers, verbose?: boolean): Promise<Batch.BatchResult> => {
        const results: Batch.BatchSuccess[] = [];
        const errors: Batch.BatchErrors[] = [];
        try {
            await axios.all((batch).map((batchItem: Batch.BatchUrl) => {
                const { data = undefined, url, method, id: batchID } = batchItem;
                return this.client({
                    url,
                    method,
                    headers,
                    data,
                    batchID

                } as Batch.BatchConfig)
                    .catch((err: AxiosError) => errors.push({ id: batchID, error: err?.response?.status || 500 }))
            }))
                .then(
                    axios.spread((...batchResults) => (
                        (batchResults as Batch.BatchResponse[]).forEach((result) => {
                            result.data && results.push({ data: result.data, id: result.config.batchID });
                        }
                        )
                    ))
                )
                .catch((err: AxiosError) => { throw err });
        } catch (err) {
            throw err;
        } finally {
            return { results, errors };
        }
    }

    axiosBatch = async ({ urls, parallelRequests = 5, batchDelayInMs = 250, headers, verbose = false }: Batch.BatchCall) => {
        let allSuccess: Batch.BatchSuccess[] = [];
        let allErrors: Batch.BatchErrors[] = [];
        let start = 0;

        const urlBatch: Batch.BatchUrl[] = this.makeBatchUrl(urls);
        const batchesCount = Math.ceil(urlBatch.length / parallelRequests);

        for (let idx = 0; idx < batchesCount; idx++) {
            const processingBatch = urlBatch.slice(start, start + parallelRequests);
            start += parallelRequests;
            const { results, errors }: Batch.BatchResult = await this.getBatchResults(processingBatch, headers, verbose);
            allSuccess.push(...results);
            allErrors.push(...errors);
            await this.waitFor(batchDelayInMs);
        }
        return { allSuccess, allErrors }
    };
}