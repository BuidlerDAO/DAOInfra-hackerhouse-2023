"use client";

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import Link from 'next/link';
import { Button, IconButton, Menu, MenuItem } from '@mui/material';
import { Mail as MailIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import styles from './index.module.scss'

export default function Header() {
    const { walletAddress, setWalletAddress, setNetwork, network } = useWallet();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleConnectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // 请求用户账户地址
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const currentAccount = accounts[0];
                setWalletAddress(currentAccount);

                // 获取当前网络
                const networkId = await window.ethereum.request({ method: 'net_version' });
                setNetwork(networkId);
            } catch (error) {
                console.error("User denied account access");
            }
        } else {
            console.error("Ethereum object doesn't exist!");
        }
    };

    return (
        <header className="flex justify-between items-center p-4">
            <Link legacyBehavior href="/">
                <p className={styles.logoText}>

                </p>
            </Link>
            {!walletAddress && (
                <Button color="primary" onClick={handleConnectWallet}>
                    Connect Wallet
                </Button>
            )}
            {walletAddress && (
                <div className="flex items-center">
                    <Button className={styles.PostProjectButton} variant="contained">
                        Post Project
                    </Button>

                    <IconButton onClick={handleClick}>
                        <MoreVertIcon />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>Add Project</MenuItem>
                        <Link href={'/profile'}>
                            <MenuItem onClick={handleClose}>
                            Profile
                            </MenuItem>
                        </Link>
                        <MenuItem onClick={handleClose}>{walletAddress}</MenuItem>
                    </Menu>

                    <IconButton>
                        <MailIcon />
                    </IconButton>
                </div>
            )}
        </header>
    );
}
