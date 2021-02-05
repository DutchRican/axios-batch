[![Build Status](https://travis-ci.com/DutchRican/axios-batch.svg?branch=master)](https://travis-ci.com/DutchRican/axios-batch)
[![Coverage Status](https://coveralls.io/repos/github/DutchRican/axios-batch/badge.svg?branch=master)](https://coveralls.io/github/DutchRican/axios-batch?branch=master)

# Axios-Batch

install to your project with:  
`npm i axios-batch`

## Examples

Instantiation without existing axios client:  
```
import { AxiosBatch } from 'axios-batch';

const ab = new AxiosBatch({ baseURL: 'https://yourEndPoint.com' });

// urls can be an array of strings or objects {url: "/posts/1", id: "myposts" };  
const requests = [{url: "/posts/1, id:"first-id"}, {url: "/posts/2", id:"other-id"}];  
const res = await ab.axiosBatch({ urls: requests });
```

Instantiation with existing axios client:  
```
import { AxiosBatch } from 'axios-batch';
import axios from 'axios';

const client = axios.create({ baseURL: 'https://yourEndPoint.com' });

const ab = new AxiosBatch({ client });

// urls can be an array of strings or objects {url: "/posts/1", id: "myposts" };  
const requests = [{url: "/posts/1, id:"first-id"}, {url: "/posts/2", id:"other-id"}];  
const res = await ab.axiosBatch({ urls: requests });
```

The returned object has the structure of `{allSuccess, allErrors}`  

allSuccess is an array with the structure of:   
```
[{data: <data-structure returned by api>, id:<id>}]
```

allErrors is an array with the structure of:  
```
[{error: <error status>, id: <id>}]
```

## Retry conditions

If a requests receives a status code of `[408, 500, 502, 504, 522 or 524]` upto 3 retries are attempted while increasing the backoff time.

### Options

AxiosBatch Class parameters:  
| Name                | Optional | default Value          |
|---------------------|----------|------------------------|
| client              | yes      | new axios instance     |
| headers             | yes      | empty object           |
| baseURL             | yes      | undefined              |
| backoffInterval     | yes      | 300 ms                 |
| degradationMax      | yes      | 6 consecutive failures |
| isDegradationSafety | yes      | false                  |

<hr />

axiosBatch function parameters
| Name             |  Optional | default Value |
|------------------|-----------|---------------|
| urls             | no        | none          |
| parallelRequests | yes       | 5             |
| batchDelayInMs   | yes       | 250ms         |
| headers          | yes       | empty object  |
| verbose          | yes       | false         |


