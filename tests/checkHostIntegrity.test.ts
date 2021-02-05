import { checkHostIntegrity } from '../lib/utils';

describe('CheckHostIntegrity', () => {
    it('should return false if there is no entry greater than the max', () => {
        const max = 3;
        const checkObject = {test: 1, other: 2};
        expect(checkHostIntegrity(checkObject, max)).toEqual(false);
    });
   
    it('should return true if there is an entry greater or equal than the max', () => {
        const max = 3;
        const checkObject = {test: 1, other: 3};
        expect(checkHostIntegrity(checkObject, max)).toEqual(true);
    });
   
    it('should return false for an empty object', () => {
        const max = 3;
        const checkObject = {};
        expect(checkHostIntegrity(checkObject, max)).toEqual(false);
    });
});