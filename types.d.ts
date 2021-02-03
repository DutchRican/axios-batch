import { AxiosRequestConfig, AxiosResponse } from 'axios';

export module Batch {
    export interface Headers {
        [key: string]: string;
    }


    export interface AxiosBatchConstructor {
        client?: AxiosInstance;
        headers?: AxiosRequestConfig['headers'];
        baseURL?: AxiosRequestConfig['baseURL'];
    }

    export interface BatchUrl {
        id: string;
        url: string;
        method?: 'get' | 'post' | 'patch' | 'put' | 'delete';
        data?: object;
    }

    export interface BatchConfig extends AxiosRequestConfig {
        batchID: string;
    }

    export interface BatchResponse extends AxiosResponse {
        config: BatchConfig;
    }

    export interface BatchCall {
        urls: BatchUrlIFace[] | string[];
        parallelRequests?: number;
        batchDelayInMs?: number;
        headers?: HeadersIFace;
        verbose?: boolean;
        method?: 'get' | 'post' | 'patch' | 'put' | 'delete';
    }

    export interface BatchSuccess {
        id: string;
        data: object;
    }

    export interface BatchErrors {
        id: string;
        error?: number;
        message?: string;
    }

    export interface BatchResult {
        results: BatchSuccess[];
        errors: BatchErrors[];
    }
}