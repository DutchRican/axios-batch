import { AxiosBatch } from '../lib/index';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

const createRequests = (count: number) => {
    return Array(count).fill(null).map((el, idx) => ({ url: `/posts/${idx}`, id: `id-${idx}` }));
}
const createUrls= (count: number) => {
    return Array(count).fill(null).map((el, idx) => `/posts/${idx}`);
}

describe('AxiosBatch', () => {
    const mock = new MockAdapter(axios);
    const baseURL= 'https://notreal.not.real';
    beforeEach(() => {
        mock.reset();
    })
    it('should combine a results object with id\'s we pass along', async () => {
        mock.onGet(new RegExp(`${baseURL}/posts/[1-9]`)).reply(200, { id: 'test', name: 'test' });
        mock.onGet(new RegExp(`${baseURL}/posts/0`)).reply(404);

        const ab = new AxiosBatch({ baseURL });
        const requests = createRequests(3);
        const res = await ab.axiosBatch({ urls: requests });
        expect(res).toEqual({allSuccess: [{data: {id: 'test', name:'test'}, id:"id-1"}, {data: {id: 'test', name: 'test'}, id:"id-2"}], allErrors: [{error: 404, id: 'id-0'}]});
    });
    
    it('should allow smaller parallelRequests, resulting in longer runtimes', async () => {
        const startTime = new Date().getTime();
        mock.onGet(new RegExp(`${baseURL}/posts/[1-9]`)).reply(200, { id: 'test', name: 'test' });
        mock.onGet(new RegExp(`${baseURL}/posts/0`)).reply(404);

        const ab = new AxiosBatch({ baseURL });
        const requests = createRequests(3);
        const res = await ab.axiosBatch({ urls: requests, parallelRequests: 1, batchDelayInMs: 150 });
        const runtime = new Date().getTime() - startTime;
        // delay is 150 per batch, 3 tries means at the least 450ms delay
        expect(runtime).toBeGreaterThan(450);
        expect(res).toEqual({allSuccess: [{data: {id: 'test', name:'test'}, id:"id-1"}, {data: {id: 'test', name: 'test'}, id:"id-2"}], allErrors: [{error: 404, id: 'id-0'}]});
    });

    it('should allow the passing of an axios instance', async () => {
        mock.onGet(new RegExp(`${baseURL}/posts/[1-9]`)).reply(200, { id: 'test', name: 'test' });
        mock.onGet(new RegExp(`${baseURL}/posts/0`)).reply(404);

        const client = axios.create({ baseURL });
        const ab = new AxiosBatch({ client });
        const requests = createRequests(3);
        const res = await ab.axiosBatch({ urls: requests });
        expect(res).toEqual({allSuccess: [{data: {id: 'test', name:'test'}, id:"id-1"}, {data: {id: 'test', name: 'test'}, id:"id-2"}], allErrors: [{error: 404, id: 'id-0'}]});
    });

    it('should combine a results object with random id\'s if none are passed', async () => {
        mock.onGet(new RegExp(`${baseURL}/posts/[1-9]`)).reply(200, { id: 'test', name: 'test' });
        mock.onGet(new RegExp(`${baseURL}/posts/0`)).reply(404);

        const ab = new AxiosBatch({ baseURL });
        const urls = createUrls(3);
        const { allSuccess, allErrors} = await ab.axiosBatch({ urls });
        expect(allErrors.length).toEqual(1);
        expect(allSuccess.length).toEqual(urls.length - 1);
        expect(allSuccess[0].id).not.toBeUndefined();
    });

    it('should allow full urls with not explicit baseURL defined', async () => {
        mock.onGet(new RegExp(`${baseURL}/posts/0`)).reply(200, { id: 'test', name: 'test' });
        mock.onGet(new RegExp(`${baseURL}/posts/1`)).reply(404);

        const ab = new AxiosBatch();
        const urls = (createUrls(2)).map(url => `${baseURL}${url}`);
        const {allSuccess, allErrors} = await ab.axiosBatch({urls});
        expect(allErrors.length).toEqual(1);
        expect(allSuccess.length).toEqual(1);
        expect(allSuccess[0].id).not.toBeUndefined();
    });

    it('should repeat a request if the failure code is in the retrycodes', async () => {
        const startTime = new Date().getTime();

        mock.onGet(new RegExp(`${baseURL}/posts/0`)).reply(500);
        const ab = new AxiosBatch({backoffInterval: 100});
        const urls = createUrls(1);
        const res = await ab.axiosBatch({ urls: [`${baseURL}${urls[0]}`] });
        const runtime = new Date().getTime() - startTime;
        // backoff is 100 per try, 3 tries means at the least 800ms delay
        expect(runtime).toBeGreaterThan(800);
    });
   
    it('should return partial object upon degradation detection', async () => {
        mock.onGet(new RegExp(`${baseURL}/posts/[1-2]`)).reply(200, { id: 'test', name: 'test' });
        mock.onGet(new RegExp(`${baseURL}/posts/[3-9 10 11]`)).reply(500);

        const ab = new AxiosBatch({backoffInterval: 1, baseURL });
        const urls = createUrls(10);
        const {allErrors, allSuccess} = await ab.axiosBatch({ urls, parallelRequests: 3 });
        expect(allSuccess.length).toEqual(2);
        expect(allErrors[allErrors.length -1].id).toEqual('warning');
    });

});