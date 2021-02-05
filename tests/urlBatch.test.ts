import { makeBatchUrl } from '../lib/utils';
import { Batch } from '../types';

describe('UrlBatch', () => {
    it('should create a batch with random ids from string urls', () => {
        const urls = ['/test/1', '/test/2'];
        const batch = makeBatchUrl(urls);
        expect(batch.length).toEqual(urls.length);
        expect(batch[0].url).toEqual(urls[0]);
        expect(batch[0].id).toBeDefined();
        expect(batch[0].method).toEqual('get');
    });
   
    it('should create a batch with BatchURL objects', () => {
        const urls = [{url: '/test/1', id: 'test1'}, {url: '/test/2', id: 'test2'}];
        const batch = makeBatchUrl(urls);
        expect(batch.length).toEqual(urls.length);
        expect(batch[0].url).toEqual(urls[0].url);
        expect(batch[0].id).toEqual(urls[0].id);
        expect(batch[0].method).toEqual('get');
    });
    
    it('should correctly set the method and data keys if passed', () => {
        const urls: Batch.BatchUrl[] = [{url: '/test/1', id: 'test1', method: 'post', data: {foo: 'bar'}}, {url: '/test/2', id: 'test2'}];
        const batch = makeBatchUrl(urls);
        expect(batch.length).toEqual(urls.length);
        expect(batch[0].url).toEqual(urls[0].url);
        expect(batch[0].id).toEqual(urls[0].id);
        expect(batch[0].method).toEqual('post');
        expect(batch[0].data).toEqual(urls[0].data);
    });
});