import React from 'react';
import { Typography, Divider, Chip, Avatar, Box } from '@mui/material';
import { Partner, PartnershipProps } from "@/Types/Partner";
import styles from './index.module.scss'

const Partnership: React.FC<PartnershipProps> = ({ partnerNum, partners }) => {
    return (
        <div className={styles.partnerContainer}>
            <Typography variant="h4">Partnership</Typography>
            <Divider />
            <Typography variant="h6">Partner num: {partnerNum}</Typography>
            <div className={styles.partnerItemContainer}>
                {partners.map((partner, index) => (
                    <Box className={styles.partnerItem} key={index} display="flex" alignItems="center" marginY={2}>
                        <Avatar src={partner.avatar} alt={partner.name} style={{ marginRight: '16px' }} />
                        <div>
                            <Typography variant="body1">{partner.name}</Typography>
                            <div>
                                {partner.chips.map((chip, chipIndex) => (
                                    <Chip size="small"  key={chipIndex} label={chip} variant="outlined" style={{ marginRight: '8px' }} />
                                ))}
                            </div>
                        </div>
                    </Box>
                ))}
            </div>
        </div>
    );
};

export default Partnership;
