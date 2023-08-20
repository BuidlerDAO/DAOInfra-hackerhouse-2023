// Reputation.tsx
import React, { useState } from 'react';
import {Typography, Divider, Chip, Avatar, Box, Button} from '@mui/material';
import { ReputationProps } from '@/Types/reputation';
import styles from './index.module.scss';
import Modal from '@mui/material/Modal';

const Reputation: React.FC<ReputationProps> = ({ reputationData }) => {

    const [open, setOpen] = useState(false);
    const [selectedComment, setSelectedComment] = useState<string | null>(null);


    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    const handleOpen = (comment: string) => {
        setSelectedComment(comment);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedComment(null);
    };

    return (
        <div className={styles.reputationContainer}>
            <Typography variant="h4">Reputation</Typography>
            <Divider />
            {reputationData.map((item, index) => (
                <>
                    <Box className={styles.reputationItem} key={index} display="flex" alignItems="center" marginY={2} onClick={() => handleOpen(item.comments)}>
                        <Avatar src={item.avatar} alt={item.projectName} style={{ marginRight: '16px' }} />
                        <div className={styles.reputationItemTitle}>
                            <Typography variant="body1">{item.projectName}</Typography>
                            <div className={`flex items-center`}>
                                {item.chips.map((chip, chipIndex) => (
                                    <Chip size="small" key={chipIndex} label={chip} variant="outlined" style={{ marginRight: '8px' }} />
                                ))}
                                <Typography variant="body2">{item.comments}</Typography>
                            </div>
                        </div>
                    </Box>
                    {index < reputationData.length - 1 && (
                        <Divider />
                    )}
                </>
            ))}
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className={styles.modalContainer}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        <b>Partnership</b> by DB3
                    </Typography>
                    <div className={styles.contentContainer}>
                        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                            {selectedComment}
                        </Typography>
                        <Button className={styles.dialogButton} variant="contained">Congratulations!🎉</Button>
                    </div>
                </Box>
            </Modal>
        </div>
    );
};

export default Reputation;
