import { AxiosBatch } from '../lib/index';
import axios from 'axios';

const requests = Array(10).fill(null).map((el, idx) => ({url: `posts/${idx}`, id: `id-${idx}` }));

// let ac = new AxiosBatch({baseURL: "https://jsonplaceholder.typicode.com", headers: { 'Content-type': 'application/json; charset=UTF-8' }});
let ac = new AxiosBatch({client: axios.create({baseURL: "https://jsonplaceholder.typicode.com", headers: { 'Content-type': 'application/json; charset=UTF-8' }})})
ac.axiosBatch({ urls: requests }).then(({ allSuccess, allErrors }) => console.log(allSuccess, allErrors));