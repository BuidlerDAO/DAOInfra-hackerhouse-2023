import { ChakraProvider } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { Web3ReactProvider } from '@web3-react/core';
import Web3 from 'web3';
import "./style.css";
import '@rainbow-me/rainbowkit/styles.css'
import { WagmiProvider } from 'providers/WagmiProvider';

require('dotenv').config();


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
        <WagmiProvider>
          <SessionProvider session={pageProps.session} refetchInterval={0}>
            <Component {...pageProps} />
          </SessionProvider>
        </WagmiProvider>
      </ChakraProvider>
    </Web3ReactProvider>
  );
};

export default MyApp;
