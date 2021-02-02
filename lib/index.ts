import axios, { AxiosError, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { type } from 'os';
import { v4 } from 'uuid';
import { BatchUrl, BatchResult, BatchConfig, BatchErrors, BatchSuccess, BatchResponse, BatchCall, Headers } from './types';

const retryCodes = [408, 500, 502, 504, 522, 524];

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount: number) => {
        return retryCount * 300; // interval for retries
    },
    retryCondition: (error: AxiosError) => {
        const status = error?.response?.status || 500;
        return retryCodes.includes(status);
    }
});

/**
 * 
 * @param <number> ms number in ms for the timeout between batches
 */
const waitFor = (ms: number) => new Promise(r => setTimeout(r, ms));

const makeBatchUrl = (urls: BatchUrl[] | string[]): BatchUrl[] => {
    let cleanBatch = (urls as any).map((item: BatchUrl | string) => {
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

const getBatchResults = async (batch: BatchUrl[], headers: Headers, verbose?: boolean): Promise<BatchResult> => {
    const results: BatchSuccess[] = [];
    const errors: BatchErrors[] = [];
    try {
        await axios.all((batch).map((batchItem: BatchUrl) => {
            const {data = undefined, url, method, id: batchID} = batchItem;
            return axios({
                url,
                method,
                headers,
                data,
                batchID

            } as BatchConfig)
                .catch((err: AxiosError) => {console.log(err); errors.push({ id: batchID, error: err?.response?.status || 500 })})
        }))
            .then(
                axios.spread((...batchResults) => (
                    (batchResults as AxiosResponse<any>[]).forEach((result) => {
                        let cfg = result.config as BatchConfig;
                        result.data && results.push({ data: result.data, id: cfg.batchID });
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

/**
 * 
 * @param <BatchCall> param0
 */
const axiosBatch = async ({ urls, parallelRequests = 5, batchDelayInMs = 250, headers, verbose = false }: BatchCall) => {
    let allSuccess: BatchSuccess[] = [];
    let allErrors: BatchErrors[] = [];
    let start = 0;

    const urlBatch: BatchUrl[] = makeBatchUrl(urls);
    const batchesCount = Math.ceil(urlBatch.length / parallelRequests);

    for (let idx = 0; idx < batchesCount; idx++) {
        const processingBatch = urlBatch.slice(start, start + parallelRequests);
        start += parallelRequests;
        const { results, errors }: BatchResult = await getBatchResults(processingBatch, headers, verbose);
        allSuccess.push(...results);
        allErrors.push(...errors);
        await waitFor(batchDelayInMs);
    }
    return { allSuccess, allErrors }
};


const requests = [
    { url: "https://jsonplaceholder.typicode.com/posts/2", id: 'asdf' },
    {
        url: "https://jsonplaceholder.typicode.com/posts", id: 'fdgdfg', method: 'post', data: {
            title: 'foo',
            body: 'bar',
            userId: 1,
        }
    },
]
axiosBatch({ urls: requests, headers: {'Content-type': 'application/json; charset=UTF-8'} }).then(({ allSuccess, allErrors }) => console.log(allSuccess, allErrors));