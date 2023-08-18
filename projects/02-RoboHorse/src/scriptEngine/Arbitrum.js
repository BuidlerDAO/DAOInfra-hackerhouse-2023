import * as utils from '../utils/utils.js';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import ArbDistributorABI from './ArbDistributor.json' assert { type: 'json' };
import Addresses from './arbAddr.json' assert { type: 'json' };

class EVMChain {
  constructor(name, chainId, rpc, wssRPC, eip1559, wallet) {
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
  }

  startMonitor() {
    if (this.hasMonitored) return;
    //this.syncPendingTx();
    //this.syncLastestBlock();
    this.syncNewBlock();
    this.hasMonitored = true;
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
    const length = pendingTransactions.length;
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
    pendingTransactions.sort((tx1, tx2) => {
      const minerFee1 = getMinerFee(tx1);
      const minerFee2 = getMinerFee(tx2);

      return minerFee2 - minerFee1;
    });
    //console.log('pending tx number', length);
    const fivePercentPriorityFeePerGas =
      '0x' + new BigNumber(getMinerFee(pendingTransactions[Math.floor(length / 20)])).toString(16);
    const tenPercentPriorityFeePerGas =
      '0x' + new BigNumber(getMinerFee(pendingTransactions[Math.floor(length / 10)])).toString(16);
    const twentyPercentPriorityFeePerGas =
      '0x' + new BigNumber(getMinerFee(pendingTransactions[Math.floor(length / 5)])).toString(16);

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

  syncPendingTx() {
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
    const txDetail = Object.keys(this.stateMonitoredExcutedTx).length > 0;
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

  async checkAddressArb() {
    var contract = new this.web3.eth.Contract(ArbDistributorABI, '0x67a24CE4321aB3aF51c2D0a4801c3E111D88C9d9');
    const contractFunc = contract.methods['claimableTokens'];
    let count = 636;
    let totalAmount = 0;
    for (let i = 0; i < Addresses.length; i++) {
      if (i < 2504) continue;
      const address = Addresses[i];
      const result = await contractFunc(address).call({ from: '0x912ce59144191c1204e64559fe8253a0e49e6548' });
      const amount = new BigNumber(result).shiftedBy(-18).toNumber();
      console.log(i, address, amount);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

// ARB合约： 0x912ce59144191c1204e64559fe8253a0e49e6548
// TokenDistributor: 0x67a24CE4321aB3aF51c2D0a4801c3E111D88C9d9
// inbox proxy: 0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f
// inbox: https://etherscan.io/address/0x5aed5f8a1e3607476f1f81c3d8fe126deb0afe94#code
// start block: 16890400  Mar 23 2023 20:59:16
const arbBlockPi = new EVMChain(
  'arbitrum-blockpi',
  1,
  'https://arbitrum.blockpi.network/v1/rpc/*',
  'wss://arbitrum.blockpi.network/v1/ws/*',
  true,
);
arbBlockPi.startMonitor();

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
