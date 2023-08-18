const EVMChain = require('./EVMChain');
const Web3 = require('web3');

class NetworkCenter {
    constructor() {
        this.networkProvider = {
            1: {'https': 'https://mainnet.infura.io/v3/e95c3e3d2d81441a8552117699ffa5bd', 'wss': 'wss://mainnet.infura.io/ws/v3/e95c3e3d2d81441a8552117699ffa5bd'}
        }
        this.networkWeb3 = {
            1: {'https': new Web3(networkProvider[1].https), 'wss': new Web3(networkProvider[1].wss)}
        }
        this.evmChains = {
            1: new EVMChain('ethereum', 1, this.networkProvider[1].https, this.networkProvider[1].wss, true)
        }
        this.evmChains[1].startMonitor();
    }

    isValidChain(chainId) {
        return this.networkProvider[chainId] != null;
    }

    getWeb3(chainId, bWss) {
        return this.networkWeb3[chainId][bWss ? 'wss' : 'https'];
    }

    getEVMChain(chainId) {
        return this.evmChains[chainId];
    }
}