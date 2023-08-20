"use client"

import React, { useState } from 'react';
import {Typography, Divider, Chip, Avatar, Box, Button} from '@mui/material';
import { NeedsProps } from "@/Types/Needs";
import styles from './index.module.scss';

const NeedsPanel: React.FC<NeedsProps> = ({ needs, currentPage }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const handleToggleExpand = (index: number) => {
        if (expandedIndex === index) {
            setExpandedIndex(null);
        } else {
            setExpandedIndex(index);
        }
    };

    const renderButtons = (index: number) => {
        if (currentPage === 'info') {
            return (
                <div>
                    <Button onClick={() => handleToggleExpand(index)}>Expand</Button>
                    <Button color="primary">Accept</Button>
                    <Button color="secondary">Reject</Button>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.needsContainer}>
            <Typography variant="h4">Needs</Typography>
            <Divider />
            {needs.map((need, index) => (
                <>
                    <Box key={need.time} className={styles.needsItem} display="flex" alignItems="center" marginY={2}>
                        <div className={`flex`}>
                            <Avatar src={need.avatar} alt={need.name} style={{ marginRight: '16px' }} />
                            <div className={styles.needsItemText}>
                                <Typography className={styles.needsItemTitle} variant="body1">
                                    {need.name}
                                    <span className={`${styles[need.status]}`}></span>
                                    {need.status}
                                </Typography>
                                <Typography variant="body2">
                                    {need.time}
                                    <Chip size="small" label={need.chip} variant="outlined" style={{ marginLeft: '8px' }} />
                                </Typography>
                            </div>
                        </div>
                        {renderButtons(index)}
                    </Box>
                    {expandedIndex === index && currentPage === 'info' && (
                        <div className={styles.expandedContent}>
                            <Typography variant={'body1'}>Details: xxxx</Typography>
                            <Typography variant={'body1'}>Details: xxxx</Typography>
                            <Divider />
                            <Typography variant={'h4'}>BO3</Typography>
                            <div>
                                <Chip size="small" label="DAO" />
                            </div>
                            <Typography variant={'body1'}>Website: xxxx</Typography>

                            <Typography variant={'body1'}>Twitter Name: xxxx</Typography>
                            <Typography variant={'body1'}>Wallet Address: xxxx</Typography>
                            <Typography variant={'body1'}>Intro: xxxx</Typography>
                            <Typography variant={'h5'}>BO3's Video</Typography>
                            <video src={'https://www.youtube.com/watch?v=gAjVmfQcffY'}></video>




                        </div>
                    )}
                    {index < needs.length - 1 && (
                        <Divider />
                    )}
                </>
            ))}
        </div>
    );
};

export default NeedsPanel;