import * as utils from '../utils/utils.js';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import request from 'request';
import fs from 'fs';
import txDetail from './txDetail.json' assert { type: "json" };

export class EVMChain {
  constructor(name, chainId, rpc, wssRPC, eip1559, wallet) {
    this.chainBlockIntervalTime = {1: 12}
    this.rpc = rpc;
    this.name = name;
    this.chainId = chainId;
    //this.intervalTime = intervalTime;
    this.web3 = new Web3(rpc);  
    this.wssWeb3 = new Web3(wssRPC);
    this.eip1559 = eip1559;
    this.wallet = wallet;
    this.nonceRecord = {};
    this.lastBlockHash = '';
    this.lastBlockNumber = 0;
    this.lastBlockTimestamp = 4812306663;
    this.stateMonitorIndex = 0; //
    this.pendingBaseFeePerGas = 0;
    this.totalPendingTx = {
      // '0x...': {  // txHash
      // }
    };
    this.interfacePendingTx = {
      // contractAddr => signature => transaction[]
      // '0x...': {  // contractAddr
      //     '0xabcdabcd': [  // signature
      //         {
      //             'txHash': '0x...',
      //             'gasPrice': 10000,
      //         }
      //     ]
      // }
    };
    this.gasMonitoredInterface = {
      // '0x...': {  // contract address
      //     '0x...': true  // interface code
      // }
    };
    this.gasMonitoredInterfaceTx = {
      // '0x...': {  // tx hash
      //      'contractAddr': '0x...',
      //      'signature': '0x12345678'
      // }
    };
    this.stateMonitoredPendingTx = {};
    this.stateMonitoredExcutedTx = {};
    this.duplicatedTx = {};
    this.userPendingTxList = {};
    this.hasMonitored = false;
    this.pendingTxInterval = null;
    this.intervalTime = 1;
    this.addNewAPI4Web3();
  }

  addNewAPI4Web3() {
    this.web3.eth.extend({
      property: 'txpool',
      methods: [{
        name: 'content',
        call: 'txpool_content'
      },{
        name: 'inspect',
        call: 'txpool_inspect'
      },{
        name: 'status',
        call: 'txpool_status'
      }]
    });
    this.web3.extend({
      property: 'filter',
      methods: [{
        name: 'newPendingTransaction',
        call: 'eth_newPendingTransactionFilter'
      },{
        name: 'getFilterChanges',
        call: 'eth_getFilterChanges',
        params: 1,
        inputFormatter: [this.web3.utils.numberToHex]
      }]
    });
    this.web3.eth.extend({
      property: 'logs',
      methods: [{
        name: 'getLogs',
        call: 'eth_getLogs',
        params: 1
      }]
    });
  }

  startMonitor() {
    if (this.hasMonitored) return;
    //this.syncPendingTxByFilter();
    //this.syncLastestBlock();
    this.syncNewBlock();
    this.hasMonitored = true;
  }

  stopMonitor() {
    if (!this.hasMonitored) return;
    console.log('stop monitor')
    this.hasMonitored = false;
    this.stopSyncPendingTx();
    this.stopSyncLastestBlock();
  }

  stopSyncPendingTx() {
    if (this.pendingTxInterval != null) {
      clearInterval(this.pendingTxInterval);
      this.pendingTxInterval = null;
    }
  }

  stopSyncLastestBlock() {
    this.wssWeb3.eth.clearSubscriptions();
  }

  async checkNetworkAvaliable() {
    try {
      await this.web3.eth.net.isListening();
      console.log('Web3 connection established');
      return true;
    } catch (error) {
      console.error('Unable to connect to Web3:', error);
      return false;
    }
  }

  async syncNonceFromChain(account) {
    const txCount = await this.web3.eth.getTransactionCount(account);
    this.nonceRecord[account] = txCount;
  }

  getGasPriceStatOnPendingTx(transactions) {
    const pendingTransactions = transactions == null ? Object.values(this.totalPendingTx) : transactions;
    this.caculateGasPrice(pendingTransactions);
  }

  getGasPriceStatLastBlock(latestBlock) {
    caculateGasPrice(latestBlock.transactions);
  }

  caculateGasPrice(transactions) {
    const length = transactions.length;
    const pendingBaseFeePerGas = new BigNumber(this.pendingBaseFeePerGas);
    if (length == 0) {
      const commonGasPrice = '0x' + new BigNumber(1).shiftedBy(18).toString(16);
      return {
        baseFeePerGas: '0x' + pendingBaseFeePerGas.toString(16),
        fivePercentPriorityFeePerGas: commonGasPrice,
        tenPercentPriorityFeePerGas: commonGasPrice,
        twentyPercentPriorityFeePerGas: commonGasPrice,
      };
    }
    const getMinerFee = (tx) => {
      const maxFee = new BigNumber(tx.maxFeePerGas == null ? tx.gasPrice : tx.maxFeePerGas);
      if (maxFee.minus(pendingBaseFeePerGas).toNumber() < 0) {
        return 0;
      }
      if (tx.maxPriorityFeePerGas == null) {
        return maxFee.minus(pendingBaseFeePerGas).toNumber();
      }
      const minerFee = Math.min(
        maxFee.minus(pendingBaseFeePerGas).toNumber(),
        new BigNumber(tx.maxPriorityFeePerGas).toNumber(),
      );
      return minerFee;
    };
    transactions.sort((tx1, tx2) => {
      const minerFee1 = getMinerFee(tx1);
      const minerFee2 = getMinerFee(tx2);

      return minerFee2 - minerFee1;
    });
    //console.log('pending tx number', length);
    const fivePercentPriorityFeePerGas =
      '0x' + new BigNumber(getMinerFee(transactions[Math.floor(length / 20)])).toString(16);
    const tenPercentPriorityFeePerGas =
      '0x' + new BigNumber(getMinerFee(transactions[Math.floor(length / 10)])).toString(16);
    const twentyPercentPriorityFeePerGas =
      '0x' + new BigNumber(getMinerFee(transactions[Math.floor(length / 5)])).toString(16);

    return {
      baseFeePerGas: '0x' + pendingBaseFeePerGas.toString(16),
      fivePercentPriorityFeePerGas,
      tenPercentPriorityFeePerGas,
      twentyPercentPriorityFeePerGas,
    };
  }

  getGasPriceStatOnInterface(contractAddr, signature) {
    if (this.interfacePendingTx[contractAddr] == null || this.interfacePendingTx[contractAddr][signature] == null) {
      return this.getGasPriceStatOnPendingTx();
    }
    const blockGasStat = this.getGasPriceStatOnPendingTx();
    const interfaceGasStat = this.getGasPriceStatOnPendingTx(this.interfacePendingTx[contractAddr][signature]);
    const fivePercentPriorityFeePerGas = new BigNumber(blockGasStat.fivePercentPriorityFeePerGas).gt(
      new BigNumber(interfaceGasStat.fivePercentPriorityFeePerGas),
    )
      ? blockGasStat.fivePercentPriorityFeePerGas
      : interfaceGasStat.fivePercentPriorityFeePerGas;
    const tenPercentPriorityFeePerGas = new BigNumber(blockGasStat.tenPercentPriorityFeePerGas).gt(
      new BigNumber(interfaceGasStat.tenPercentPriorityFeePerGas),
    )
      ? blockGasStat.tenPercentPriorityFeePerGas
      : interfaceGasStat.tenPercentPriorityFeePerGas;
    const twentyPercentPriorityFeePerGas = new BigNumber(blockGasStat.twentyPercentPriorityFeePerGas).gt(
      new BigNumber(interfaceGasStat.twentyPercentPriorityFeePerGas),
    )
      ? blockGasStat.twentyPercentPriorityFeePerGas
      : interfaceGasStat.twentyPercentPriorityFeePerGas;
    return {
      baseFeePerGas: interfaceGasStat.baseFeePerGas,
      fivePercentPriorityFeePerGas,
      tenPercentPriorityFeePerGas,
      twentyPercentPriorityFeePerGas,
    };
  }

  // from: 0x000,0x111...
  // to: 0x000,0x111...
  // valueCondition: {value: 1, op: '>/</=/>=/<='}
  // parameterCondition = {para1: {op: '>', value: 1}, para2: {op: '<', value: 1}, }
  addStateMonitoredPendingTx(from, to, valueCondition, signature, inputs, parameterCondition, callback) {
    this.stateMonitoredPendingTx[this.stateMonitorIndex++] = {
      from,
      to,
      valueCondition,
      signature,
      inputs,
      parameterCondition,
      callback,
    };
    return this.stateMonitorIndex;
  }

  removeStateMonitoredPendingTx(index) {
    if (this.stateMonitoredPendingTx[index] != null) {
      delete this.stateMonitoredPendingTx[index];
    }
  }

  addStateMonitoredExcutedTx(from, to, valueCondition, signature, inputs, parameterCondition, callback) {
    this.stateMonitoredExcutedTx[this.stateMonitorIndex++] = {
      from,
      to,
      valueCondition,
      signature,
      inputs,
      parameterCondition,
      callback,
    };
    return this.stateMonitorIndex;
  }

  removeStateMonitoredExcutedTx(index) {
    if (this.stateMonitoredExcutedTx[index] != null) {
      delete this.stateMonitoredExcutedTx[index];
    }
  }

  addGasMonitoredPendingTx(contractAddr, signature, comment) {
    this.gasMonitoredInterface[this.stateMonitorIndex++] = { contractAddr, signature, comment };
    return this.stateMonitorIndex;
  }

  removeGasMonitoredPendingTx(index) {
    if (this.gasMonitoredInterface[index] != null) {
      delete this.gasMonitoredInterface[index];
    }
  }

  syncPendingTxByFilter() {
    const blockIntervalTime = this.chainBlockIntervalTime[this.chainId];
    
    this.pendingTxInterval = setInterval(() => {
      const curTime = new Date().getTime() / 1000;
      const interval = curTime - this.lastBlockTimestamp;
      console.log(curTime, this.lastBlockTimestamp, interval + 's', blockIntervalTime);
      if (interval > 0 && interval < blockIntervalTime * 2) {     
        console.log('start get pending tx');   
        this.intervalTime = blockIntervalTime;        
        
        this.web3.filter.newPendingTransaction().then(filterId => {
          setTimeout(() => {
            this.web3.filter
              .getFilterChanges(filterId)
              .then(txs => {
                console.log('get pending tx from filter', txs.length, filterId); 
                console.log(txs);               
              })
              .catch(console.error);
          }, 8000);
        });

        clearInterval(this.pendingTxInterval);
        this.syncPendingTxByFilter();
      }
    }, this.intervalTime * 1000);
  }

  syncPendingTxDirectly() {
    const blockIntervalTime = this.chainBlockIntervalTime[this.chainId];
    
    this.pendingTxInterval = setInterval(() => {
      const curTime = new Date().getTime() / 1000;
      const interval = curTime - this.lastBlockTimestamp;
      console.log(curTime, this.lastBlockTimestamp, interval + 's', blockIntervalTime);
      if (interval > blockIntervalTime * 2 / 3 && interval < blockIntervalTime * 2) {     
        console.log('start get pending directly');   
        this.intervalTime = blockIntervalTime;        
        this.web3.eth.getPendingTransactions().then(txs => console.log(txs.length)).catch(console.error);
        clearInterval(this.pendingTxInterval);
        this.syncPendingTxDirectly();
      }
    }, this.intervalTime * 1000);
  }

  // too expansive to get the data from rpc node
  syncPendingTxOnceByTxpool() {
    const blockIntervalTime = this.chainBlockIntervalTime[this.chainId];
    
    this.pendingTxInterval = setInterval(() => {
      const curTime = new Date().getTime() / 1000;
      const interval = curTime - this.lastBlockTimestamp;
      console.log(curTime, this.lastBlockTimestamp, interval + 's', blockIntervalTime);
      if (interval > blockIntervalTime * 2 / 3 && interval < blockIntervalTime * 2) {     
        console.log('start get pending tx from txpool');   
        this.intervalTime = blockIntervalTime;        
        this.web3.eth.txpool.content().then(console.log).catch(console.error);
        clearInterval(this.pendingTxInterval);
        this.syncPendingTxOnce();
      }
    }, this.intervalTime * 1000);
  }

  syncPendingTxOneByOne() {
    const _this = this;
    let txCount = 0;
    this.wssWeb3.eth
      .subscribe('pendingTransactions', function (error, result) {
        if (error != null) console.log(error.message);
      })
      .on('data', function (transactionHash) {
        // 对于重复出现的Pending交易，基本可以认定为非正常交易，可以将其移除出统计队列
        if (_this.totalPendingTx[transactionHash] != null || _this.duplicatedTx[transactionHash] != null) {
          delete _this.totalPendingTx[transactionHash];
          _this.duplicatedTx[transactionHash] = true;
          return;
        }

        _this.web3.eth.getTransaction(transactionHash).then(function (transaction) {
          if (transaction == null) return;

          // 对那些取消的交易（通过判断新接收的交易的from & nonce是否重复），也需要移除出统计队列
          const from = transaction.from;
          const isContractTx = transaction.input.length >= 10;
          const contractAddr = transaction.to;
          const signature = isContractTx ? transaction.input.substring(0, 10) : '';
          transaction.signature = signature;

          let replacedTx = false;
          if (this.userPendingTxList[from] == null) {
            this.userPendingTxList[from] = [];
          } else {
            this.userPendingTxList[from] = this.userPendingTxList[from].map((txInfo) => {
              if (txInfo.nonce == transaction.nonce) {
                console.log(
                  'replace tx:',
                  from,
                  nonce,
                  'old:',
                  txInfo.maxPriorityFee,
                  txInfo.maxFee,
                  'new:',
                  transaction.maxPriorityFeePerGas,
                  transaction.maxFeePerGas,
                );
                const oldTxHash = txInfo.hash;
                delete _this.totalPendingTx[oldTxHash];
                delete _this.gasMonitoredInterfaceTx[oldTxHash];

                txInfo.hash = transactionHash;
                replacedTx = true;

                if (_this.interfacePendingTx[contractAddr][signature] != null) {
                  _this.interfacePendingTx[contractAddr][signature] = _this.interfacePendingTx[contractAddr][
                    signature
                  ].map((tx) => {
                    if (tx.hash != oldTxHash) return tx;
                  });
                }
              }
              return txInfo;
            });
          }
          if (!replacedTx) {
            this.userPendingTxList[from].push({
              nonce: transaction.nonce,
              hash: transaction.hash,
              maxPriorityFee: transaction.maxPriorityFeePerGas,
              maxFee: transaction.maxFeePerGas,
            });
            txCount++;
          }
          //if (txCount % 100 == 0) console.log('tx count', txCount);
          console.log(transaction);
          _this.totalPendingTx[transactionHash] = transaction;

          Object.values(_this.gasMonitoredInterface).map((monitorInfo) => {
            if (
              monitorInfo.contractAddr.toUpperCase() == contractAddr.toUpperCase() &&
              monitorInfo.signature == signature
            ) {
              if (_this.interfacePendingTx[contractAddr] == null) {
                _this.interfacePendingTx[contractAddr] = {};
                _this.interfacePendingTx[contractAddr][signature] = [];
              }
              _this.interfacePendingTx[contractAddr][signature].push(transaction);
              _this.gasMonitoredInterfaceTx[transaction.hash] = {
                contractAddr: contractAddr,
                signature: signature,
              };
            }
          });
          Object.values(_this.stateMonitoredPendingTx).map((monitorInfo) => {
            // {from, to, valueCondition, signature, inputs, parameterCondition, callback}
            _this.monitorTx(monitorInfo, transaction);
          });
        });
      });
  }

  monitorTx(monitorInfo, transaction) {
    const signatureIsNull = utils.isEmptyObj(transaction.signature);
    if (
      !utils.isEmptyObj(monitorInfo.from) &&
      monitorInfo.from.toUpperCase().indexOf(transaction.from.toUpperCase()) == -1
    ) {
      return;
    }
    if (
      !utils.isEmptyObj(monitorInfo.to) &&
      ((!signatureIsNull && monitorInfo.to.toUpperCase() != transaction.to.toUpperCase()) ||
        (signatureIsNull && monitorInfo.to.toUpperCase().indexOf(transaction.to.toUpperCase()) == -1))
    ) {
      return;
    }
    if (monitorInfo.valueCondition != null) {
      const value = new BigNumber(transaction.value);
      const comparedValue = new BigNumber(monitorInfo.valueCondition.value).shiftedBy(18);
      const op = monitorInfo.valueCondition.op;

      const expected = utils.aShouldOpB(value, op, comparedValue);
      if (!expected) return;
    }

    if (!utils.isEmptyObj(transaction.signature) && transaction.signature == monitorInfo.signature) {
      const data = transaction.input.substr(10);
      const parameters = this.web3.eth.abi.decodeParameters(monitorInfo.inputs, data);
      // parameterCondition = {para1: {op: '>', value: 1}, para2: {op: '<', value: 1}, }
      for (const [parameter, condition] of Object.entries(monitorInfo.parameterCondition)) {
        if (!utils.aShouldOpB(parameters[parameter], condition.op, condition.value)) {
          return;
        }
      }
      transaction.decodedParameter = parameters;
    }
    const callbackFunc = monitorInfo.callback;
    callbackFunc(transaction);
  }

  getBlock(blockHashOrBlockNumber) {
    const _this = this;
    const txDetail = true; //Object.keys(this.stateMonitoredExcutedTx).length > 0;
    this.web3.eth.getBlock(blockHashOrBlockNumber, txDetail, (error, block) => {
      if (error != null) {
        console.log('get the block after 1s', blockHashOrBlockNumber);
        setTimeout(() => {
          _this.getBlock(blockHashOrBlockNumber);
        }, 1000);

        return;
      }
      console.log(blockHashOrBlockNumber, txDetail, block.hash);
      if (_this.lastBlockHash == block.hash) return;
      _this.lastBlockHash = block.hash;
      _this.lastBlockNumber = block.number;
      _this.lastBlockTimestamp = block.timestamp;

      _this.eip1559
        ? _this.caculatePendingBaseFee(block.baseFeePerGas, block.gasLimit, block.gasUsed)
        : _this.getGasPrice();
      this.getGasPriceStatLastBlock(block);
      const now = Math.round(new Date() / 1000);
      //console.log(now, block.number, block.timestamp, 'latest block transcations:', block.transactions.length, (block.number + 1) + ' base gas fee', _this.pendingBaseFeePerGas);
      block.transactions.map((txInfo) => {
        const txHash = txInfo;
        if (txDetail) {
          txHash = txInfo.hash;
          Object.values(_this.stateMonitoredExcutedTx).map((monitorInfo) => {
            // {from, to, valueCondition, signature, inputs, parameterCondition, callback}
            _this.monitorTx(monitorInfo, txInfo);
          });
        }
        if (_this.totalPendingTx[txHash] == null) return;

        delete _this.totalPendingTx[txHash];

        if (_this.gasMonitoredInterfaceTx[txHash] != null) {
          const contractAddr = _this.gasMonitoredInterfaceTx[txHash].contractAddr;
          const signature = _this.gasMonitoredInterfaceTx[txHash].signature;

          const remainTransactions = this.interfacePendingTx[contractAddr][signature].filter(
            (transaction) => transaction.hash != txHash,
          );
          this.interfacePendingTx[contractAddr][signature] = remainTransactions;

          delete _this.gasMonitoredInterfaceTx[txHash];
        }
      });
    });
  }

  syncNewBlock() {
    const _this = this;
    this.wssWeb3.eth
      .subscribe('newBlockHeaders', function (error, result) {
        if (error != null) console.log(error.message);
      })
      .on('data', function (blockHeader) {
        _this.lastBlockTimestamp = blockHeader.timestamp;

        const now = Math.round(new Date() / 1000);
        console.log(
          _this.name,
          blockHeader.number,
          now,
          ' - ',
          blockHeader.timestamp,
          ' = ',
          now - blockHeader.timestamp,
        );
        _this.getBlock(blockHeader.number);
      });
  }

  // 通过上一个区块的gas使用情况，计算本区块需要支付的基本gas费
  caculatePendingBaseFee(parentBaseFeePerGas, parentGasLimit, parentGasUsed) {
    const parentGasTarget = Math.floor(parentGasLimit / 2);
    if (parentGasTarget == parentGasUsed) {
      this.pendingBaseFeePerGas = parentBaseFeePerGas;
    } else {
      if (parentGasTarget > parentGasUsed) {
        const gasUsedDelta = parentGasTarget - parentGasUsed;
        const gasDelta = parentBaseFeePerGas * Math.floor(Math.floor(gasUsedDelta / parentGasTarget) / 8);
        this.pendingBaseFeePerGas = parentBaseFeePerGas - gasDelta;
      } else if (parentGasTarget < parentGasUsed) {
        const gasUsedDelta = parentGasUsed - parentGasTarget;
        const gasDelta = Math.max(parentBaseFeePerGas * Math.floor(Math.floor(gasUsedDelta / parentGasTarget) / 8), 1);
        this.pendingBaseFeePerGas = parentBaseFeePerGas + gasDelta;
      }
    }
  }

  getGasPrice() {
    const _this = this;
    this.web3.eth.getGasPrice().then((gasPrice) => {
      _this.pendingBaseFeePerGas = gasPrice;
    });
    return this.pendingBaseFeePerGas;
  }

  getNonce(account) {
    this.nonceRecord[account]++;
    return this.nonceRecord[account];
  }

  buildTx(from, to, value, signature, gasPriceType, maxFeePerGas) {
    var interfaceGasPrices;
    var maxPriorityFeePerGas;
    if (gasPriceType == 'constant') {
      maxPriorityFeePerGas = '0x' + new BigNumber(maxFeePerGas).shiftedBy(9).toString(16);
    } else {
      interfaceGasPrices = this.getGasPriceStatOnInterface(to, signature);
      if (gasPriceType == 'fivePercent') {
        maxPriorityFeePerGas = interfaceGasPrices.fivePercentPriorityFeePerGas;
      } else if (gasPriceType == 'tenPercent') {
        maxPriorityFeePerGas = interfaceGasPrices.tenPercentPriorityFeePerGas;
      } else if (gasPriceType == 'twentyPercent') {
        maxPriorityFeePerGas = interfaceGasPrices.twentyPercentPriorityFeePerGas;
      }
    }

    const tx = {
      from,
      to,
      data,
      value: '0x' + new BigNumber(value).shiftedBy(18).toString(16),
      nonce: this.getNonce(from),
    };
    if (this.eip1559) {
      const baseFeePerGas = interfaceGasPrices.baseFeePerGas;
      maxFeePerGas = '0x' + new BigNumber(baseFeePerGas).plus(new BigNumber(maxPriorityFeePerGas)).toString(16);
      tx.maxFeePerGas = maxFeePerGas;
      tx.maxPriorityFeePerGas = maxPriorityFeePerGas;
    } else {
      tx.gasPrice = maxPriorityFeePerGas;
    }

    return tx;
  }

  // syncLastestBlock() {
  //     getBlock('latest');
  //     setInterval(() => {
  //         getBlock();
  //     }, this.intervalTime);
  // }

  getLastBlockTimestamp() {
    return this.lastBlockTimestamp;
  }

  getLastBlockNumber() {
    return this.lastBlockNumber;
  }

  getLastBlockHash() {
    return this.lastBlockHash;
  }

  getWeb3() {
    return this.web3;
  }
}

// const ethereumBlockPi = new EVMChain(
//   'ethereum-blockpi',
//   1,
//   'https://ethereum.blockpi.network/v1/rpc/b29e4d758236bccac31683408ffa266e41b7b463', //'https://eth-mainnet.g.alchemy.com/v2/v0PproF8lbsKkBDLqruaGyMq2OK-3_f5',//'https://mainnet.infura.io/v3/e95c3e3d2d81441a8552117699ffa5bd', //'https://eth-goerli.alchemyapi.io/v2/AxnmGEYn7VDkC4KqfNSFbSW9pHFR7PDO', //
//   'wss://ethereum.blockpi.network/v1/ws/b29e4d758236bccac31683408ffa266e41b7b463', // 'wss://eth-mainnet.g.alchemy.com/v2/v0PproF8lbsKkBDLqruaGyMq2OK-3_f5',//'wss://mainnet.infura.io/ws/v3/e95c3e3d2d81441a8552117699ffa5bd',  //'wss://eth-goerli.ws.alchemyapi.io/v2/AxnmGEYn7VDkC4KqfNSFbSW9pHFR7PDO', //
//   true,
// );

// let web3 = ethereumBlockPi.getWeb3();
// ethereumBlockPi.startMonitor();
// setTimeout(() => {
//   ethereumBlockPi.stopMonitor();
// }, 60000);


const subscribeEvent = () => {        
  const web3 = ethereumBlockPi.getWeb3();
  const contractAbi = [{"inputs":[{"internalType":"contract IERC20","name":"_token","type":"address"},{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"claimer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"bytes32[]","name":"merkleProof","type":"bytes32[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"hasClaimed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isAirdropEnabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"merkleRoot","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"}],"name":"setMerkleRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_isAirdropEnabled","type":"bool"}],"name":"toggleAirdrop","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]

  const topicSig = web3.utils.sha3('Claimed(address,uint256)')
  const contractAddress = '0x8FA891cC08A7c8f78CD6D202bAEC5024F615D778';

  web3.eth.txpool.status().then(console.log);

  const parameter = {
    fromBlock: 17198719,
    toBlock: 'latest',
    address: contractAddress,
    topics: [topicSig]
  };
  console.log(JSON.stringify(parameter));

  web3.eth.logs.getLogs(parameter).then(console.log);

  console.log(web3.utils.numberToHex(17198719));

  //curl https://mainnet.infura.io/v3/e95c3e3d2d81441a8552117699ffa5bd -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_getLogs","params":[{"fromBlock":"0x1066e7f","toBlock":"latest","address":"0x8FA891cC08A7c8f78CD6D202bAEC5024F615D778","topics":["0xd8138f8a3f377c5259ca548e70e4c2de94f129f5a11036a15b69513cba2b426a"]}],"id":1}'
  // var contract = new web3.eth.Contract(contractAbi, '0x8FA891cC08A7c8f78CD6D202bAEC5024F615D778');
  //const eventKey = subscript.to + '-' + subscript.name;
  // const contractSubObject = contract.events['Claimed']({filter: '', fromBlock: 17198719, topics: [topicSig]}, 
  //                                                         function(error, event) { console.log(event) });
  // contractSubObject.on("connected", function(subscriptionId){
  //     console.log('new subscriptionId', subscriptionId);
  // });
  // contractSubObject.on('data', function(event) {      
  //     console.log(event);
  // });
  // contractSubObject.on('error', console.error);
}
// const hash1 = '0xcb1e491aef3ced2f7c6356a78be98357486af6f6a601ea87db0f9404fddd4275';
// const hash2 = '0x5ab97c4982f697ca27b2792be682d3f972e43a5f83887f0acc2977d16434234e';
// let concatenatedHashes = hash1.slice(2) + hash2.slice(2);
// let hash = '0x' + web3.utils.soliditySha3(concatenatedHashes, { t: 'uint256', v: 4 }).slice(2);
// console.log(hash);

// concatenatedHashes =  hash2.slice(2) + hash1.slice(2);
// hash = '0x' + web3.utils.soliditySha3(concatenatedHashes, { t: 'uint256', v: 4 }).slice(2);
// console.log(hash);

// const hash = ethereumBlockPi.getWeb3().utils.soliditySha3(
//   { t: 'address', v: address1 },
//   { t: 'address', v: address2 }
// );
// console.log(hash);
const rootHash = '0x6c9f4ec5eee9597f240e9a97f877a78ced19d6ec351fa6b3ea39f7e7afc4bdfd';

const getRoot = () => {
  const tx = txDetail[0];
  const leaf = tx.from;
  const input = tx.input.substring(10);
  let proof = []
  for (let i = 0; i < input.length; i += 64) {
    const slice = input.slice(i, i + 64);
    proof.push('0x' + slice);
  }
  proof = proof.slice(2, proof.length);
  console.log(proof.length);

  const index = 21;

  // 计算叶子节点的哈希
  const leafHash = '0x' + web3.utils.soliditySha3(leaf).slice(2);

  // 计算每个节点的哈希
  let nodeHash = leafHash;
  let direction;
  for (let i = 0; i < proof.length; i++) {
    if ((index >> i) & 1) {
      // 向右
      nodeHash = '0x' + web3.utils.soliditySha3(nodeHash, proof[i]).slice(2);
      direction = 'right';
    } else {
      // 向左
      nodeHash = '0x' + web3.utils.soliditySha3(proof[i], nodeHash).slice(2);
      direction = 'left';
    }
    console.log(`Node ${i} (${direction}): ${nodeHash}`);
  }

  // 输出 Merkle 树的根哈希
  const merkleRoot = nodeHash;
  console.log(`Merkle root: ${merkleRoot}`);
  console.log(rootHash);
}

const getMerkle = async () => {  
  console.log(txDetail.length);
  let leftHead = [];
  let rightHead = [];
  let leftHeadObj = {};
  let rightHeadObj = {};
  for (let i = 0; i < txDetail.length; i++) {
    const transaction = txDetail[i];
    const input = transaction.input.substring(10);
    const hashes = []
    for (let i = 0; i < input.length; i += 64) {
      const slice = input.slice(i, i + 64);
      hashes.push('0x' + slice);
    }
    leftHead.push(hashes[2]);
    rightHead.push(hashes[hashes.length - 1]);  

    if (leftHeadObj[hashes[2]]) {
      console.log('left', hashes[2]);
    } else
      leftHeadObj[hashes[2]] = true;
    
    if (rightHeadObj[hashes[hashes.length - 1]]) {
      console.log('right', hashes[hashes.length - 1]);
    } else 
      rightHeadObj[hashes[hashes.length - 1]] = true;
  }
  return;
  console.log(leftHead.length, rightHead.length);
  for (let i = 0; i < leftHead.length; i++) {
    for (let j = 0; j < rightHead.length; j++) {
      const concatenatedHashes = leftHead[i].slice(2) + rightHead[j].slice(2);
      console.log(concatenatedHashes, leftHead[i], rightHead[j]);
      const hash = '0x' + web3.utils.soliditySha3(concatenatedHashes, { t: 'uint256', v: 4 }).slice(2);
      console.log(hash);
      if (hash.toUpperCase() == rootHash.toUpperCase()) {
        console.log(hash, leftHead[i], rightHead[j]);
        return;
      }
    }
  }
}

//getMerkle();

// const ethereumChainstack = new EVMChain('ethereum-chainstack',
//                               1,
//                               'https://', //
//                               'wss://',
//                               true);
// ethereumChainstack.startMonitor();

// ethereumBlockPi.addGasMonitoredPendingTx('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0x38ed1739', 'UniswapV2Router02: swapExactTokensForTokens');
// ethereumBlockPi.addGasMonitoredPendingTx('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', '0x5ae401dc', 'SwapRouter02: Multicall');
// ethereumBlockPi.addGasMonitoredPendingTx('0x00000000006c3852cbEf3e08E8dF289169EdE581', '0xfb0f3ee1', 'Seaport');

// //console.log(ethereum.gasMonitoredInterface);

// setInterval(() => {
//     // const blockGasPrices = ethereum.getGasPriceStatOnPendingTx();
//     // console.log('block gas:',
//     //             new BigNumber(blockGasPrices.fivePercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//     //             new BigNumber(blockGasPrices.tenPercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//     //             new BigNumber(blockGasPrices.twentyPercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei');
//     const lastBlockTimestamp = ethereum.getLastBlockTimestamp();
//     const now = Math.round(new Date() / 1000);
//     console.log('    ', now, lastBlockTimestamp, 'time interval:', now - lastBlockTimestamp);
//     if (now - lastBlockTimestamp < 8) return;

//     var interfaceGasPrices = ethereum.getGasPriceStatOnInterface('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', '0x5ae401dc');
//     if (interfaceGasPrices != null)
//         console.log('SwapRouter02: Multicall gas:',
//                     new BigNumber(interfaceGasPrices.baseFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.fivePercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.tenPercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.twentyPercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei');

//     interfaceGasPrices = ethereum.getGasPriceStatOnInterface('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0x38ed1739');
//     if (interfaceGasPrices != null)
//         console.log('UniswapV2Router02: swapExactTokensForTokens gas:',
//                     new BigNumber(interfaceGasPrices.baseFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.fivePercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.tenPercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.twentyPercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei');

//     interfaceGasPrices = ethereum.getGasPriceStatOnInterface('0x00000000006c3852cbEf3e08E8dF289169EdE581', '0xfb0f3ee1');
//     if (interfaceGasPrices != null)
//         console.log('Seaport gas:',
//                     new BigNumber(interfaceGasPrices.baseFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.fivePercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.tenPercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei, ',
//                     new BigNumber(interfaceGasPrices.twentyPercentPriorityFeePerGas).shiftedBy(-9).toString(10) + ' GWei');
// }, 20000000);


