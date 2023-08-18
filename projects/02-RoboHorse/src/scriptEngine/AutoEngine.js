import assert from 'assert';
import * as utils from '../../utils/utils';
import Converter from './Converter';


const BigNumber = require('bignumber.js');

const ValueType = {from: 1, to: 2, value: 3, gasPrice: 4, parameter: 5}
const timeInterval = {1: 8}

/*

*/
class AutoEngine {
    constructor(scriptConfigInfo, networkCenter, wallet) {
        this.subscripts = scriptConfigInfo.subScripts;
        this.executionOrder = scriptConfigInfo.executionOrder;
        
        this.converter = new Converter(scriptConfigInfo);

        this.eventSubscribeObjList = [];
        this.wFuncGasMonitor = [];
        this.pendingTxStateMonitor = [];
        this.excutedTxStateMonitor = [];

        this.networkCenter = networkCenter;
        this.wallet = wallet;

        this.bStop = false;
    }

    getNonce(account) {
        return this.wallet.getNonce(account);
    }

    // getAbi(chainId, contractAddr, name, signature) {
    //     const contractAbi = this.contractAbi[chainId][contractAddr];
    //     if (contractAbi == null) {
    //         throw contractAddr + '’s abi cant be found.';
    //     }
    //     const web3 = this.networkCenter.getWeb3(subscript.chainId);
    //     for (var i = 0; i < contractAbi.length; i++) {
    //         const interfaceAbi = contractAbi[i];
    //         if (interfaceAbi.type != 'function' || interfaceAbi.type != 'event') continue;
    //         const sig = interfaceAbi.type == 'function' ? web3.eth.abi.encodeFunctionSignature(interfaceAbi) : web3.eth.abi.encodeEventSignature(interfaceAbi);
    //         if (sig == signature) {
    //             return {interfaceAbi, inputs: interfaceAbi.inputs};
    //         }
    //     }
    //     throw name + ' can‘t be found in contract ABI.';
    // }

    // 预处理脚本，譬如监听事件、交易等
    async preProcessScript() {
        Object.entries(this.subscripts).map(entry => {
            const subscript = this.converter.convertSubScript(entry[1]);
            const type = subscript.type;
            if (!this.networkCenter.isValidChain(subscript.chainId)) {
                throw '网络不支持:' + subscript.chainId;
            }
            const evmChain = this.networkCenter.getEVMChain(subscript.chainId);
            evmChain.startMonitor();
            const abiInfo = subscript.element;
            
            if (type == 'event') {
                this.subscribeEvent(subscript);
            } else if (type == 'wFunc') {
                const monitorId = evmChain.addGasMonitoredPendingTx(subscript.to, subscript.signature, '');
                evmChain.syncNonceFromChain(subscript.from);
                this.wFuncGasMonitor.push({evmChain, monitorId});
            } else if (type == 'pendingTx') {
                const monitorId = evmChain.addStateMonitoredPendingTx(subscript.from, subscript.to, subscript.valueCondition, 
                                                    subscript.signature, abiInfo.inputs, subscript.parameterCondition, 
                                                    (transaction) => {
                                                        subscript.result = [transaction, ...subscript.result];
                                                    });
                this.pendingTxStateMonitor.push({evmChain, monitorId});
            } else if (type == 'executedTx') {
                const monitorId = evmChain.addStateMonitoredExcutedTx(subscript.from, subscript.to, subscript.valueCondition, 
                                                    subscript.signature, abiInfo.inputs, subscript.parameterCondition, 
                                                    (transaction) => {
                                                        subscript.result = [transaction, ...subscript.result];
                                                    });
                this.excutedTxStateMonitor.push({evmChain, monitorId});
            } else if (type == 'rFunc' || type == 'tgMsg' || type == 'clearResult') {
                // don't need to preProcess
            } 
        });
    }

    stopEngine() {
        this.bStop = true;
        this.eventSubscribeObjList.map(subscribeObj => {
            subscribeObj.unsubscribe();
        });
        this.wFuncGasMonitor.map(monitorInfo => {
            monitorInfo.evmChain.removeGasMonitoredPendingTx(monitorInfo.monitorId);
        });
        this.pendingTxStateMonitor.map(monitorInfo => {
            monitorInfo.evmChain.removeStateMonitoredPendingTx(monitorInfo.monitorId);
        });
        this.excutedTxStateMonitor.map(monitorInfo => {
            monitorInfo.evmChain.removeStateMonitoredExcutedTx(monitorInfo.monitorId);
        });

        this.eventSubscribeObjList = [];
        this.wFuncGasMonitor = [];
        this.pendingTxStateMonitor = [];
        this.excutedTxStateMonitor = [];
    }

    runScript() {
        this.preProcessScript();
        while (!this.bStop) {
            this.executionOrder.map(subscriptTitle => {
                if (!this.bStop) {
                    const subscript = this.subscripts[subscriptTitle];
                    this.runSubscript(subscript);
                }
            })
        }
    }

    async runSubscript(subscript) {
        const type = subscript.type;
        if (type == 'event') {
            // 在预处理阶段已经登记，此处无需处理
        } else if (type == 'rFunc') {
            this.readData(subscript);
        } else if (type == 'wFunc') {
            this.writeData(subscript);
        } else if (type == 'clearResult') {
            this.clearResult(subscript);
        } else if (type == 'tgMsg') {
            this.sendTgMsg(subscript);
        }  else if (type == 'stopScript') {
            this.stopScript(subscript);
        }  else if (type == 'rCex') {
            this.readCexPrice(subscript);
        }  else if (type == 'rWeb2') {
            this.readWeb2Data(subscript);
        }  else if (type == 'pendingTx' || type == 'executedTx') {
            // 在预处理阶段已经登记，此处无需处理，因为这两种类型仅用于监控交易，其它类型的子脚本会使用这类交易的信息
        }
    }
    
    /*
        {
            'type': 'event',
            'chainId': 1,
            'contractAddr': '0x...',
            'name': 'interfaceName',
            'abi': {},
            'filter': {
                'para1': [
                    1, 2
                ]
            },
            'maxBlockInterval': 30,  // 最大区块间隔时间
            'result': [
                {
                    returnValues: {
                        myIndexedParam: 20,
                        myOtherIndexedParam: '0x123456789...',
                        myNonIndexParam: 'My String'
                    },
                    raw: {
                        data: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
                        topics: ['0xfd43ade1c09fade1c0d57a7af66ab4ead7c2c2eb7b11a91ffdd57a7af66ab4ead7', '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385']
                    },
                    event: 'MyEvent',
                    signature: '0xfd43ade1c09fade1c0d57a7af66ab4ead7c2c2eb7b11a91ffdd57a7af66ab4ead7',
                    logIndex: 0,
                    transactionIndex: 0,
                    transactionHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
                    blockHash: '0xfd43ade1c09fade1c0d57a7af66ab4ead7c2c2eb7b11a91ffdd57a7af66ab4ead7',
                    blockNumber: 1234,
                    address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe'
                }
            ]
        }
    */
   /*
    myContract.once(event[, options], callback) : https://web3js.readthedocs.io/en/v1.7.4/web3-eth-contract.html#once
    myContract.events.MyEvent([options][, callback]): https://web3js.readthedocs.io/en/v1.7.4/web3-eth-contract.html#contract-events
    myContract.getPastEvents(event[, options][, callback]) : https://web3js.readthedocs.io/en/v1.7.4/web3-eth-contract.html#getpastevents
   */
    /*
        事件只要及时记录下来即可，其它step会访问事件数据，做出相应动作
    */
    subscribeEvent(subscript) {        
        const web3 = this.networkCenter.getEVMChain(subscript.chainId).getWeb3();
        const contractAbi = subscript.element;
        var contract = new web3.eth.Contract(contractAbi, subscript.to);
        //const eventKey = subscript.to + '-' + subscript.name;
        const contractSubObject = contract.events[subscript.name]({filter: subscript.filter, fromBlock: 'latest', topics: [subscript.signature]}, 
                                                                function(error, event) { console.log(event) });
        contractSubObject.on("connected", function(subscriptionId){
            console.log('new subscriptionId', subscriptionId);
        });
        contractSubObject.on('data', function(event) {
            subscript.result = [event, ...subscript.result];
            console.log(subscript.result);
        });
        contractSubObject.on('error', console.error);
        this.eventSubscribeObjList.push(contractSubObject);
    }
    
    
    async getPriceFromBinance(symbol) {
        const binancePriceUrl = 'https://api.binance.com/api/v3/ticker/price?symbol=' + symbol;
        const resp = await fetch(binancePriceUrl, {});
        const result = await resp.json();
        return result.price;
    }
    
    async checkDependences(subscript) {        
        if (subscript.conditions.length == 0) return true;

        if (subscript.conditions.length >= 2 && subscript.logic == null) {
            throw 'logic should NOT be null when the number of conditions is larger than 1.';
        }

        const isInternalSubscript = (subscriptName) => {
            return subscriptName == 'timer' || subscriptName == 'blockNumber' || subscriptName == 'gasPrice' || subscriptName == 'cexPrice' || subscriptName == 'customScript';
        }
        const checkDependentCondition = async (condition) => {
            const subscript = this.subscripts[condition.subscriptName];
            if (isInternalSubscript(condition.subscriptName)) {
                const subscriptName = condition.subscriptName;
                var originValue;
                if (subscriptName == 'timer') {
                    originValue = new Date().getTime();
                } else if (subscriptName == 'blockNumber') {
                    const evmChain = this.networkCenter.getEVMChain(condition.dependencyChainId);
                    originValue = evmChain.getLastBlockNumber();
                } else if (subscriptName == 'gasPrice') {
                    const evmChain = this.networkCenter.getEVMChain(condition.dependencyChainId);
                    originValue = evmChain.getGasPrice();
                } else if (subscriptName == 'cexPrice') {
                    originValue = await this.getPriceFromBinance(condition.tokenSymbol);
                } else if (subscriptName == 'customScript') {
                    originValue = await this.executeScript(condition.compareValue);
                    if (typeof originValue != 'boolean') return false;
                    if (!originValue) return false;
                }
                const expected = utils.aShouldOpB(originValue, condition.compareType, condition.compareValue);
                if (!expected) return false;
            } else {
                if (subscript.type == 'event' || subscript.type == 'rFunc') {
                    var result = subscript.result.returnValues[condition.paraName];
                    if (result == null) 
                        result = subscript.result.returnValues[condition.paraIndex];
                    if (result == null) return false;
                    const expected = utils.aShouldOpB(result, condition.compareType, condition.compareValue);
                    if (!expected) return false;
                } else if (subscript.type == 'wFunc') {
                    if ('ReceiptSuccess' != subscript.result.status) return false;
                } else if (subscript.type == 'pendingTx') {
                    if (subscript.result.length == 0) return false;
                } else if (subscript.type == 'executedTx') {
                    if (subscript.result.length == 0) return false;
                } else {
                    throw 'Not supported type:' + subscript.type + ' in dependency';
                }
            }
            return true;
        }

        if (subscript.logic == null) {
            assert(subscript.conditions.length == 1, 'The number of conditions should be 1 when logic is null');
            const result = await checkDependentCondition(subscript.conditions[0]);
            return result;
        }

        const isAnd = subscript.logic == 'and';
        for (var i = 0; i < subscript.conditions.length; i++) {
            const condition = subscript.conditions[i];
            const result = await checkDependentCondition(condition);
            if (isAnd && !result) return false;
            if (!isAnd && result) return true;
        }
        return isAnd;
    }
    /*
    'parameters': [
          {  // 本地输入
            'paraName': 'para1',
            'value': 1
          },
          {  // 从事件中提取参数值
            'paraName': 'para2',
            'index': 1,
            'subIndex': 0,
            'referenceParaName': 'para1',
            'op': '+',
            'externalValue': 1
          },
          {  // 从只读接口中获取返回值作为参数值
            'index': 1,
            'subIndex': 0,
            'paraName': 'para3',
            'referenceParaName': 'para1',    // 只能是返回值
            'referenceParaIndex': 0，        // 当返回值没有名称的时候，用序号
            'op': '+',
            'externalValue': 1
          },
          {  // 从pendingtx/excutedTx中获取参数值
            'index': 1,
            'subIndex': 0,
            'paraName': 'para3',
            'referenceType': 'from',         // {from: 1, to: 1, value: 1, gasPrice: 1, parameter: 1}
            'referenceParaName': 'para1',    // 只能是返回值
            'referenceParaIndex': 0，        // 当返回值没有名称的时候，用序号
            'op': '+',
            'externalValue': 1
          }
        ],
    */
    prepareFuncInputValues(subscript) {
        const inputValues = [];
        var parametersOK = true;
        var len = subscript.parameters.length;
        for (var i = 0; i < len; i++) {
            const parameter = subscript.parameters[i];
            if (utils.isEmptyObj(parameter.subscriptName)) {
                inputValues.push(parameter.value);
            } else {
                const subscript = this.subscripts[parameter.subscriptName];
                if (subscript.result.length == 0) {
                    parametersOK = false;
                    break;
                }
                var paraValue;
                if (subscript.type == 'event') {
                    paraValue = this.getEventValue(subscript, parameter.referenceParaName);
                } else if (subscript.type == 'rFunc') {
                    paraValue = this.getRFuncValue(subscript, parameter.referenceParaName, parameter.referenceParaIndex);    
                } else if (subscript.type == 'pendingTx' || subscript.type == 'executedTx') {
                    paraValue = this.getTxValue(subscript, parameter.referenceType, parameter.referenceParaName, parameter.referenceParaIndex);
                } else if (subscript.type == 'rCex') {
                    const priceInfo = subscript.result[0];
                    paraValue = '0x' + new BigNumber(priceInfo.price).shiftedBy(8).toString(16);
                } else if (subscript.type == 'rWeb2') {
                    paraValue = subscript.result[0][parameter.referenceParaName];
                }
                paraValue = (parameter.op && parameter.externalValue) ? utils.aOpB(paraValue, parameter.op, parameter.externalValue) : paraValue;
                inputValues.push((parameter.op && parameter.externalValue) ? '0x' + paraValue.toString(16) : paraValue);
            }
        }
        return {parametersOK, inputValues};
    }
    /*
    {
        'dependencies': [
          {
            'index': 0,
            'subIndex': 0,
            'dependentCondition': {  // event / rFunc
              'paraName': 'para1',  // 只能是返回值
              'paraIndex': 0,        // 当返回值没有名称的时候，用序号
              'compareType': 'eq/lt/gt/lte/gte/between/include/includedBy',
              'compareValue': 100000
            }
          },
          {
            'index': 2,
            'subIndex': 0,
            'dependentCondition': {  // wFunc
              'status': 'receiptSuccess'
            }
          }
        ],
        'type': 'rFunc',
        'from': '0x...',
        'chainId': 1,
        'contractAddr': '0x...',
        'name': 'interfaceName',
        'abi': [],
        'parameters': [
          {  // 本地输入
            'paraName': 'para1',
            'inputType': 'local',
            'value': 1
          },
          {  // 从事件中提取参数值
            'paraName': 'para2',
            'index': 1,
            'subIndex': 0,
            'inputType': 'event',
            'interfaceName': 'xxxx',
            'referenceParaName': 'para1'
          },
          {  // 从只读接口中获取返回值作为参数值
            'paraName': 'para3',
            'inputType': 'rFunc',
            'interfaceName': 'xxxx',
            'referenceParaName': 'para1',  // 只能是返回值
            'referenceParaIndex': 0        // 当返回值没有名称的时候，用序号
          }
        ],
        'result': [
          {
            'blockNumber': 1,  // 记录当前区块信息
            'blockHash': '0x...',
            'paraInfo': [
              {
                'paraName': 'para1',
                'paraValue': 1
              }
            ]
          }
        ]
      }
      */
    readData(subscript) {
        const invokeContract = () => {
            const web3 = this.networkCenter.getEVMChain(subscript.chainId).getWeb3();;
            const contractAbi = subscript.element;
            var contract = new web3.eth.Contract(contractAbi, subscript.to);
            const contractFunc = contract.methods[subscript.signature];
            const inputValueInfo = this.prepareFuncInputValues(subscript);
            if (!inputValueInfo.parametersOK) return;
            
            const inputValues = inputValueInfo.inputValues;
            var fromAddr = '';
            if (subscript.from.valueType == 'constant') {
                fromAddr = subscript.from.address;
            } else {
                fromAddr = this.getValueFromSubscript(subscript.from.subscriptName, subscript.from.address, 0, subscript.from.referenceType);
            }
            contractFunc(...inputValues).call({from: fromAddr}).then(result => {
                const evmChain = this.networkCenter.getEVMChain(subscript.chainId);
                subscript.result.push({
                    'blockNumber': evmChain.getLastBlockNumber(),
                    'blockHash': evmChain.getLastBlockHash(),
                    'returnValues': result
                })
            });
        }
        
        this.checkDependences(subscript).then(bPass => {
            if (bPass) {
                if (subscript.delayedTime > 0) {
                    setTimeout(() => {
                        invokeContract();
                    }, subscript.delayedTime * 1000);
                } else {
                    invokeContract();
                }
            }
        });
    }
    
    /*
        'gasPriceType': 'fivePercent/tenPercent/twentyPercent/constant',   // frontInGlobal: 本区块内靠前，frontInFunc: 本接口内靠前
        'maxFeePerGas': '100', // GWei
        'value': 1,  // eth
        'result': {
            'blockNumber': 1,  // 记录当前区块信息
            'blockHash': '0x...',
            'txHash': '0x...',
            'status': 'TxSent/TxSentErr/ReceiptSuccess/ReceiptFailed'
        }
    */    
    writeData(subscript) {
        const invokeContract = () => {
            const evmChain = this.networkCenter.getEVMChain(subscript.chainId);
            const web3 = evmChain.getWeb3();
            const contractAbi = subscript.element;
            var contract = new web3.eth.Contract(contractAbi, subscript.to);
            const contractFunc = contract.methods[subscript.signature];
            const inputValueInfo = this.prepareFuncInputValues(subscript);
            if (!inputValueInfo.parametersOK) return;
            
            const inputValues = inputValueInfo.inputValues;
            const data = contractFunc(...inputValues).encodeABI();
            var maxPriorityFeePerGas;
            var maxFeePerGas;
            const sendContractTx = (tx) => {
                contractFunc(...inputValues).estimateGas({from: subscript.from}).then(gasLimit => {
                    tx.gasLimit = gasLimit;
                    const privateKey = this.wallet.getPrivateKey(subscript.from);
                    if (privateKey != null) {
                        web3.eth.accounts.signTransaction(tx, privateKey).then(signedTx => {
                            subscript.txHash = signedTx.transactionHash;
                            web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction)
                            .on('transactionHash', txHash => {
                                subscript.result.status = 'TxSent';
                            })
                            .on('receipt', receipt => {
                                subscript.result.status = receipt.status ? 'ReceiptSuccess' : 'ReceiptFailed';
                                subscript.result.blockNumber = receipt.blockNumber;
                                subscript.result.blockHash = receipt.blockHash;
                            })
                            .on('error', error => {
                                subscript.result.status = 'TxSentErr';
                            });
                        });
                    } else {
                        web3.eth.sendTransaction(tx)
                        .on('transactionHash', txHash => {
                            subscript.result.status = 'TxSent';
                        })
                        .on('receipt', receipt => {
                            subscript.result.status = receipt.status ? 'ReceiptSuccess' : 'ReceiptFailed';
                            subscript.result.blockNumber = receipt.blockNumber;
                            subscript.result.blockHash = receipt.blockHash;
                        })
                        .on('error', error => {
                            subscript.result.status = 'TxSentErr';
                        });
                    }
                });
            }
            const sendTransaction = () => {
                const tx = evmChain.buildTx(subscript.from, subscript.to, subscript.value, subscript.signature, subscript.gasPriceType, subscript.maxFeePerGas);
                sendContractTx(tx);
            }
            if (subscript.gasPriceType == 'constant') {
                const tx = evmChain.buildTx(subscript.from, subscript.to, subscript.value, subscript.signature, subscript.gasPriceType, subscript.maxFeePerGas);
                sendContractTx(tx);
            } else {
                const lastBlockTimestamp = evmChain.getLastBlockTimestamp();
                const now = Math.round(new Date() / 1000);
                
                if (now - lastBlockTimestamp >= timeInterval[subscript.chainId]) {   // different blockchain need have different time interval
                    sendTransaction();
                } else {
                    const waitTime = timeInterval[subscript.chainId] - (now - lastBlockTimestamp);
                    setInterval(() => { 
                        sendTransaction();
                      }, waitTime * 1000);
                }
            }
        }
        this.checkDependences(subscript).then(bPass => {
            if (bPass) {
                if (subscript.delayedTime > 0) {
                    setTimeout(() => {
                        invokeContract();
                    }, subscript.delayedTime * 1000);
                } else {
                    invokeContract();
                }
            }
        });
    }
    
    /*
    {
        'dependencies': [],
        'type': 'clearResult',
        'indexList': [
            {
                index: 1,
                subIndex: 1
            }
        ]
    }
    */
    clearResult(subscript) {
        if (this.checkDependences(subscript)) {
            subscript.indexList.map(indexInfo => {
                const subscript = this.subscripts[indexInfo.index][indexInfo.subIndex];
                subscript.result = [];
            });
        }
    }

    sendTgMsg(subscript) {
        if (this.checkDependences(subscript)) {
            this.sendTeleMsg2User(subscript.toUserId, subscript.message);
        }
    }

    readCexPrice(subscript) {
        subscript.result = [];
        this.getPriceFromBinance(subscript.tokenSymbol).then(tokenPrice => {
            subscript.result.push({tokenSymbol: subscript.tokenSymbol, price: tokenPrice, time: new Date().getTime()});
        })
    }

    async executeScript(scriptCode) {
        async function looseJsonParse(code){
            return await Function('require', 'BigNumber', 'web3', '"use strict";return (' + code + '())')(require, require('bignumber.js'), web3);
        }
        if (scriptCode.indexOf('localStorage') > 0) {
            throw 'can NOT use localStorage to access the local info';
        }
        const result = await looseJsonParse(scriptCode);
        return result;
    }

    readWeb2Data(subscript) {
        subscript.result = [];
        this.executeScript(subscript.scriptCode).then(result => {
            subscript.result.push(result);
        })
    }

    sendTeleMsg2User(chatId, message) {        
        const telegramUrl = 'https://api.telegram.org/bot5529134860:AAFybUx2Ed2qoE85BaLwC5bhv2E0DcKWSC0/sendMessage?chat_id=' + chatId + '&text=' + message;
        fetch(telegramUrl, {}).then(resp => {
            resp.json().then(result => {
              console.log(result);
            });
          })
    }

    stopScript(subscript) {
        this.checkDependences(subscript).then(bPass => {
            if (bPass) {
                if (subscript.delayedTime > 0) {
                    setTimeout(() => {
                        this.stopEngine = true;
                    }, subscript.delayedTime * 1000);
                } else {
                    this.stopEngine = true;
                }
            }
        });
    }

    
    /*
    {
        'dependencies': [],
        'type': 'pendingTx',
        'chainId': 1,
        'contractAddr': '0x...',
        'name': 'interfaceName',
        'inputs': [],
        'filter': {
          'para1': [1,2]
        },
        'result': [
          {
            'blockNumber': 1,
            'blockHash': '0x...',
            'txHash': '0x...',
            'gasPrice': 100,
            'from': '0x...',
            'paraInfo': [
              {
                'paraName': 'para1',
                'paraValue': 1
              }
            ]
          }
        ]
      }
    */
    
    getEventValue(subscript, paraName) {
        var paraValue = null;   
        //const currentBlockNumber = this.networkCenter.getEVMChain(subscript.chainId).getLastBlockNumber(); 
        subscript.result.forEach(result => {
            if (paraValue != null) return;
            if (result.returnValues[paraName] == null) throw 'in event, no value of ' + paraName;
            paraValue = result.returnValues[paraName];
        })
        return paraValue;
    }
    
    // 获得rFunc结果值
    getRFuncValue(subscript, paraName, paraIndex) {
        var paraValue = null;
        subscript.result.forEach(result => {
            if (paraValue != null) return;
            if (result.returnValues[paraName] == null && result.returnValues[paraIndex] == null) throw 'no value of ' + paraName;
            paraValue = result.returnValues[paraName] != null ? result.returnValues[paraName] : result.returnValues[paraIndex];
        })
        return paraValue;
    }

    getTxValue(subscript, valueType, paraName, paraIndex) {
        if (subscript.result.length == 0) {
          throw 'the result of ' + subscript.type + ' is null';
        }
        const transaction = subscript.result[0];
        if (valueType == ValueType.from) {
            return transaction.from;
        } else if (valueType == ValueType.to) {
            return transaction.to;
        } else if (valueType == ValueType.value) {
            return new BigNumber(transaction.value);
        } else if (valueType == ValueType.gasPrice) {
            return new BigNumber(transaction.gasPrice);
        } else if (valueType == ValueType.parameter) {
            var paraValue = null;
            if (transaction.decodedParameter[paraName] == null && transaction.decodedParameter[paraIndex] == null) throw 'no value of ' + paraName + ' in ' + transaction.hash;
            paraValue = transaction.decodedParameter[paraName] != null ? transaction.decodedParameter[paraName] : transaction.decodedParameter[paraIndex];
            return paraValue;
        }
    }

    getValueFromSubscript(subscript, paraName, paraIndex, referenceType) {
        var resultValue;
        if (subscript.type == 'event') {
            resultValue = this.getEventValue(subscript, paraName);      
        } else if (subscript.type == 'rFunc') {
            resultValue = this.getRFuncValue(subscript, paraName, paraIndex);  
        } else if (subscript.type == 'pendingTx' || subscript.type == 'executedTx') {
            resultValue = this.getTxValue(subscript, referenceType, paraName, paraIndex);
        }
        return resultValue;
    }
}