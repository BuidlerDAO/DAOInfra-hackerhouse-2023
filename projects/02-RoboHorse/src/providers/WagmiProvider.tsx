import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
  lightTheme,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  polygonZkEvm,
  polygonZkEvmTestnet,
  goerli,
  zkSync,
  zkSyncTestnet,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { createContext, useContext } from 'react';

interface Context {
}

export const WagmiContext = createContext<Context>({} as Context);

export const useWagmi = () => {
  return useContext(WagmiContext);
};

const theme = darkTheme();

// theme.colors.accentColor = '#6667ab';
// theme.colors.profileForeground = '#373741';
// theme.colors.modalBackground = '#373741';
// theme.radii.modal = '16px';

const { chains, publicClient } = configureChains(
  [arbitrum, mainnet, polygon, goerli, optimism, zkSync, zkSyncTestnet, polygonZkEvm, polygonZkEvmTestnet],
  [
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'RoboHorse',
  projectId: 'a2e9ac1b7b3d06d6f1322a7a39f20132',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

export const WagmiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider appInfo={{ appName: 'Rainbowkit Demo' }} chains={chains} theme={theme}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};
