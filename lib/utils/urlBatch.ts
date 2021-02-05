import { v4 } from 'uuid';
import { Batch } from '../../types';

export const  makeBatchUrl = (urls: Batch.BatchUrl[] | string[]): Batch.BatchUrl[] => {
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