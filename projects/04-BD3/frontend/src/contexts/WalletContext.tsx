"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface WalletProviderProps {
    children: ReactNode;
}

interface WalletContextData {
    walletAddress: string | null;
    network: string | null;
    setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
    setNetwork: React.Dispatch<React.SetStateAction<string | null>>;
}

const WalletContext = createContext<WalletContextData | undefined>(undefined);

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [network, setNetwork] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            // 监听账户变化
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                setWalletAddress(accounts[0]);
            });

            // 监听网络变化
            window.ethereum.on('chainChanged', (chainId: string) => {
                setNetwork(chainId);
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', setWalletAddress);
                window.ethereum.removeListener('chainChanged', setNetwork);
            }
        };
    }, []);


    return (
        <WalletContext.Provider value={{ walletAddress, setWalletAddress, network, setNetwork }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
