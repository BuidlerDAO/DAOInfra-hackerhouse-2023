import BinancePairs from 'asset/BinancePairs.json';


const xenAddr: Record<number, string> = {1: '', 10: '0xED78Df1176B02D293aB3862962d6306B3E049140', 97: '0xf6c2dD2616641F2C98cf379b02a565b01c08D4Ac', 42161: '0x03436a2E91b1DA5B8a7fE0D7DDCa29C1d99858D4', 42170: '0xcD7a02e76E2dfDf51f18172f61Bc7F052969DEBf'}
const xNFTAddr: Record<number, string> = {1: '', 10: '0x5890d7C746bF3209830D19b9F78fE5Cb48B3B7fc', 97: '0x3D01d388829771A4DaA9aE48291487c9b4e73dfa', 42161: '0xB5F69e63d480b11e5b77a09FAE26FE12f86bd78e', 42170: '0x45f8557bbfA0dDF90A3B4E3f97e0E72648839638'}
const rewardCalculatorAddr: Record<number, string> = {1: '', 10: '0x05c168ED7B6d2e5728673290ae3A30Be3c83fdcc', 97: '0x8E8D032040B64a4CE7bf9631338F1E7b8Ea9511f', 513100: '', 42161: '0x1f11fA49735FCF151b1d716e4E6785A59c0BC77D', 42170: '0x3C2438fC7F9e552037ce5F817BF3072aDD5Ab474'}
const dPoolAddr: Record<number, string> = {1: '', 10: '0xD17504ac2EbD0A437bA4197F8951683abC9F8D9B', 97: '0xe6686E1cc9939FC43e1400A76E304e3AF1317A3a', 513100: '', 42161: '0xB863829A90c378865AB4aE86d1B862043F6E15Fd', 42170: '0xACD351313c824cFBa070C405693aE8fe495395F8'}
const fansNFTFactoryAddr: Record<number, string> = {1: '', 5: "0x4eA18bE9d846a0764823a58475B1c3552d6767f4", 6: "0x4Ce8a943aDd3788F8c19724437537E50D4631fE5", 10: '0xD17504ac2EbD0A437bA4197F8951683abC9F8D9B', 97: '0x0f5EF1Ab0C2EeD6e8b90501afD4F37dad73C2b1d', 513100: '', 42161: '0xB863829A90c378865AB4aE86d1B862043F6E15Fd', 42170: '0xACD351313c824cFBa070C405693aE8fe495395F8'}
const marketFactoryAddr: Record<number, string> = {1: '', 5: "0x4fc0ADcCc69aAA9C30E2d27778f9Ad05e22D6e41", 6: "", 10: '', 97: '', 513100: '', 42161: '', 42170: ''}
const marketHelperAddr: Record<number, string> = {1: '', 5: "0x5b3FAAFA7D5b447Ca68c73543B3338db16e35b1b", 6: "", 10: '', 97: '', 513100: '', 42161: '', 42170: ''}
const flatDirectoryAddr: Record<number, string> = {1: '', 5: "0x6d3B3858FDdafd4A3E1d32Cc8930D05EA492A67A"}
const accessManagerAddr: Record<number, string> = {1: '', 5: "0x11d5E3a4B488b1182ce1810239b3c86F9c56D1c8"}
const chainId2NetworkName: Record<number, string> = {1: 'Ethereum', 5: 'Goerli', 10: 'Optimism', 97: 'BSC-Testnet', 42161: 'Arbitrum-One', 80001: 'Mumbai', 42170: 'Arbitrum-Nova'}
const unit: Record<number, string> = {1: 'ETH', 5: 'ETH', 10: 'ETH', 97: 'BNB', 42161: 'ETH', 42170: 'ETH', 80001: 'MATIC', 10001: 'ETHW', 513100: 'ETF'}
const wssUrl: Record<number, string> = {1: '', 10: 'wss://opt-mainnet.g.alchemy.com/v2/dmf-XRM4NB-5FYuPl_Mve_l8rhBC7eIg', 97: 'wss://data-seed-prebsc-2-s1.binance.org:8545', 513100: '', 42161: 'wss://arb-mainnet.g.alchemy.com/v2/la_OXSSsbdo5vFpkwjlDJ45N5D4K-IdC', 42170: 'wss://nova.arbitrum.io/feed'}
const FullZeroAddr: string = "0x0000000000000000000000000000000000000000";
enum MergeType {
    FromAdd = 1,
    FromRemove,
    FromModify,
    ToAdd,
    ToRemove,
    Clear
  }

const evmChainIds: Record<number, string> = {
    1: "Ethereum",
    5: "Goerli",
    10: "Optimism",
    56: "BSC",
    66: "Okexchain",
    97: "BSC Testnet",
    128: "Heco",
    137: "Polygon",
    250: "Fantom",
    321: "Kucoin",
    1284: "Moonbeam",
    2020: "Ronin",
    42161: "Arbitrum One",
    42170: "Arbitrum Nova",
    42220: "Celo",
    42262: "Oasis",
    43114: "Avalanche",
    80001: "Ploygon Mumbai",
    1313161554: "Aurora",
    1666600000: "Harmony",
};

const BroswerScan: Record<number, any> = {
  1: {'webUrl': 'https://api.etherscan.io', 'apiKey': process.env.REACT_APP_ETHScanApiKey},
  56: {'webUrl': 'https://api.bscscan.com', 'apiKey': process.env.REACT_APP_BSCScanApiKey},
  137: {'webUrl': 'https://api.polygonscan.com', 'apiKey': process.env.REACT_APP_PolygonScanApiKey},
  42161: {'webUrl': 'https://api.arbiscan.io', 'apiKey': process.env.REACT_APP_ArbScanApiKey}
}
const getABIUrl: string = '{scanUrl}/api?module=contract&action=getabi&apikey={apiKey}&address={contractAddr}';

const CEXInfo: Record<string, any> = {
  'Binance': {'baseUrl': 'https://api.binance.com', 'allSpotsUrl': '/api/v3/exchangeInfo?permissions=SPOT', 
              'priceUrl': '/api/v3/ticker/price?symbol=', 'depthUrl': '/api/v3/depth?symbol=', 'tradingPairs': BinancePairs},
}

export {evmChainIds, flatDirectoryAddr, fansNFTFactoryAddr, marketFactoryAddr, marketHelperAddr, 
        FullZeroAddr, xenAddr, xNFTAddr, rewardCalculatorAddr, dPoolAddr, chainId2NetworkName, unit, wssUrl, MergeType,
        BroswerScan, getABIUrl, CEXInfo, accessManagerAddr}