import { ChakraProvider } from '@chakra-ui/react';
import { createConfig, configureChains, WagmiConfig } from 'wagmi';
import { arbitrum, mainnet, polygon, goerli, optimism, zkSync, zkSyncTestnet, polygonZkEvm, polygonZkEvmTestnet } from 'wagmi/chains'
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { extendTheme } from '@chakra-ui/react';
import { publicProvider } from 'wagmi/providers/public';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Modal } from '@web3modal/react'
import Web3 from 'web3';
import "./style.css";

require('dotenv').config();

const chains = [arbitrum, mainnet, polygon, goerli, optimism, zkSync, zkSyncTestnet, polygonZkEvm, polygonZkEvmTestnet]
const { publicClient } = configureChains(chains, [publicProvider()]);
const projectId = "a2e9ac1b7b3d06d6f1322a7a39f20132" // process.env.REACT_APP_WcProjectID
//console.log('projectID', process.env, projectId)

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});
const ethereumClient = new EthereumClient(wagmiConfig, chains)

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({ config });

const MyApp = ({ Component, pageProps }: AppProps) => {

  function getLibrary(provider_: any) {
    return new Web3(provider_)
  }

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ChakraProvider resetCSS theme={theme}>
        <WagmiConfig config={wagmiConfig}>
          <SessionProvider session={pageProps.session} refetchInterval={0}>
            <Component {...pageProps} />
          </SessionProvider>
        </WagmiConfig>
        <Web3Modal 
          themeVariables={{
            '--w3m-font-family': 'Roboto, sans-serif',
            '--w3m-accent-color': 'gray.500'
          }} 
          projectId={projectId} 
          ethereumClient={ethereumClient} />
      </ChakraProvider>
    </Web3ReactProvider>
  );
};

export default MyApp;
