import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { URL } from 'url';
import { Batch } from '../types';
import { checkHostIntegrity, hasValidBaseURL, makeBatchUrl, waitFor } from './utils';

const retryCodes = [408, 500, 502, 504, 522, 524];

export class AxiosBatch {
    client: AxiosInstance;
    headers?: AxiosRequestConfig['headers'];
    baseURL?: AxiosRequestConfig['baseURL'];
    backoffInterval: number;
    degradationMax: number;
    isDegradationSafety?: boolean;

    private degradationChecks: { [key: string]: number };

    /**
     * 
     * @param {Batch.AxiosBatchConstructor} config 
     */
    constructor(config: Batch.AxiosBatchConstructor = {}) {
        const { headers = {}, client, baseURL, backoffInterval = 300, degradationMax = 6, isDegradationSafety = false } = config;
        this.headers = headers;
        this.baseURL = client ? client.defaults.baseURL : baseURL;
        this.client = client || axios.create({ baseURL, headers });
        this.backoffInterval = backoffInterval;
        this.degradationChecks = {};
        this.degradationMax = degradationMax;
        this.isDegradationSafety = isDegradationSafety;

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
    

    private getBatchResults = async (batch: Batch.BatchUrl[], headers: Headers, verbose?: boolean): Promise<Batch.BatchResult> => {
        const results: Batch.BatchSuccess[] = [];
        const errors: Batch.BatchErrors[] = [];
        try {
            await axios.all((batch).map((batchItem: Batch.BatchUrl) => {
                const { data = undefined, url, method, id: batchID } = batchItem;
                let hostname = (new URL(this.baseURL || url)).hostname;
                return this.client({
                    url,
                    method,
                    headers,
                    data,
                    batchID

                } as Batch.BatchConfig)
                    .catch((err: AxiosError) => {
                        verbose && console.log(`[info]:: request for ${batchID} failed with ${err?.response?.status || 500}`);
                        this.degradationChecks[hostname] = ++this.degradationChecks[hostname] || 0;
                        return errors.push({ id: batchID, error: err?.response?.status || 500 });
                    })
            }))
                .then(
                    axios.spread((...batchResults) =>
                        (batchResults as Batch.BatchResponse[]).forEach((result) => {
                            if (typeof result === 'object') {
                                let serverUrl = result.config?.baseURL;
                                if (serverUrl) {
                                    let hostname = (new URL(serverUrl)).hostname;
                                    this.degradationChecks[hostname] = Math.max(--this.degradationChecks[hostname] || 0, 0);
                                }
                                verbose && console.log(`[info]:: request for ${result.config?.batchID} succeeded`);
                                result.data && results.push({ data: result.data, id: result.config?.batchID });
                            }
                        })
                    )
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
        this.degradationChecks = {};

        const urlBatch: Batch.BatchUrl[] = makeBatchUrl(urls);
        if (!hasValidBaseURL(this.baseURL, urlBatch)) throw new Error('Provide either a baseURL or fully qualified urls');
        
        const batchesCount = Math.ceil(urlBatch.length / parallelRequests);

        for (let idx = 0; idx < batchesCount; idx++) {
            if (this.isDegradationSafety && checkHostIntegrity(this.degradationChecks, this.degradationMax)) {
                return { allSuccess, allErrors: [...allErrors, { id: 'warning', message: 'too many errors from server' }] };
            }
            const processingBatch = urlBatch.slice(start, start + parallelRequests);
            start += parallelRequests;
            const { results, errors }: Batch.BatchResult = await this.getBatchResults(processingBatch, headers, verbose);
            allSuccess.push(...results);
            allErrors.push(...errors);
            await waitFor(batchDelayInMs);
        }
        return { allSuccess, allErrors }
    };  
}
