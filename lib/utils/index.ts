export { checkHostIntegrity } from './checkHostIntegrity';
export { hasValidBaseURL } from './checkValidBaseURL';
export { makeBatchUrl } from './urlBatch';

/**
* 
* @param {number} ms number in ms for the timeout between batches
*/
export const waitFor = (ms: number) => new Promise(r => setTimeout(r, ms));