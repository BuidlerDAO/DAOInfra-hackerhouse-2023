import * as utils from '../utils/utils.js';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import FoxeAirdropABI from './FoxeAirdropABI.json' assert { type: 'json' };
import txDetail from './txDetail.json' assert { type: "json" };
import { EVMChain } from './EVMChain.js';

const check = async () => {
  const ethereumBlockPi = new EVMChain(
    'ethereum-blockpi',
    1,
    'https://ethereum.blockpi.network/v1/rpc/b29e4d758236bccac31683408ffa266e41b7b463', //'https://eth-mainnet.g.alchemy.com/v2/v0PproF8lbsKkBDLqruaGyMq2OK-3_f5',//'https://mainnet.infura.io/v3/e95c3e3d2d81441a8552117699ffa5bd', //'https://eth-goerli.alchemyapi.io/v2/AxnmGEYn7VDkC4KqfNSFbSW9pHFR7PDO', //
    'wss://ethereum.blockpi.network/v1/ws/b29e4d758236bccac31683408ffa266e41b7b463', // 'wss://eth-mainnet.g.alchemy.com/v2/v0PproF8lbsKkBDLqruaGyMq2OK-3_f5',//'wss://mainnet.infura.io/ws/v3/e95c3e3d2d81441a8552117699ffa5bd',  //'wss://eth-goerli.ws.alchemyapi.io/v2/AxnmGEYn7VDkC4KqfNSFbSW9pHFR7PDO', //
    true,
  );
  
  let web3 = ethereumBlockPi.getWeb3();
  let foxeAirdropAddr = '0x8FA891cC08A7c8f78CD6D202bAEC5024F615D778';
  
  let contract = new web3.eth.Contract(FoxeAirdropABI, foxeAirdropAddr);
  
  const contractFunc = contract.methods['claim'];
  
  const checkedTxHash = '0x80845a81a04f67906a26f7ac21cc3d432d95868b3b74c057e6c101695fd30349';
  let go = false;
  const maxLength = txDetail.length;
  let count = 0;
  for (let i = 0; i < maxLength; i++) {
    const tx = txDetail[i];
    if (tx.hash == checkedTxHash) {
      go = true;    
    }
    if (!go) continue;

    const input = tx.input.substring(10);
    let proof = []
    for (let i = 0; i < input.length; i += 64) {
      const slice = input.slice(i, i + 64);
      proof.push('0x' + slice);
    }
    proof = proof.slice(2, proof.length);
    console.log(count++);
    
    try {
      await contractFunc(proof).estimateGas({from: '0x177CfCD9286B30D27122e9b308140E14Bc353a05'});
      console.log('sucess---------------', tx.hash)
    } catch (error) {
      console.log('fail', tx.hash)
    }
  }
}

check();