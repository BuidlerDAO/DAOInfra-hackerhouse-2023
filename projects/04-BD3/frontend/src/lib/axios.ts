// lib/axios.js
import axios from 'axios';

const aron = 'http://192.168.74.104:8080/';
const kj = 'https://api.web3bd.network/ ';

const aronInstance = axios.create({
    baseURL: aron,
    timeout: 1000,
    headers: {'X-Custom-Header': 'foobar'}
});

const kjInstance = axios.create({
    baseURL: kj,
    timeout: 1000,
    headers: {'X-Custom-Header': 'foobar'}
});

export { aronInstance, kjInstance };
