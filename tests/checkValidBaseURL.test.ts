import { hasValidBaseURL } from '../lib/utils';

describe('CheckValidBaseURL', () => {
    it('should return true if a baseURL is set', () => {
        const baseURL = 'htpps://test.test';
        const urls = [{url: '/posts', id: 'test'}];

        expect(hasValidBaseURL(baseURL, urls)).toEqual(true);
    });
   
    it('should return true if the urls include hostname', () => {
        const baseURL = undefined;
        const urls = [{url: 'htpps://test.test/posts', id: 'test'}];

        expect(hasValidBaseURL(baseURL, urls)).toEqual(true);
    });
    
    it('should return false if the urls do not include hostname and there is no baseURL', () => {
        const baseURL = undefined;
        const urls = [{url: '/posts', id: 'test'}];

        expect(hasValidBaseURL(baseURL, urls)).toEqual(false);
    });
});