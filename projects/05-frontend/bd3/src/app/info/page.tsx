"use client"

import React, { useState } from 'react';
import styles from './index.module.scss'
import Typography from "@mui/material/Typography";
import ProfilePanel from "@/components/ProfilePanel/ProfilePanel";
import partnersData from "@/data/partner";
import Partnership from "@/components/PartnerPanel/PartnerPanel";
import needs from "@/data/needs";
import NeedsPanel from "@/components/NeedsPanel/NeedsPanel";

const InfoPage: React.FC = () => {
    const [selectedMenu, setSelectedMenu] = useState<string>('Partnership');

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}  style={{ width: '20%' }}>
                <img className={styles.InfoAvatar} src="https://www.citypng.com/public/uploads/preview/-51614559661pdiz2gx0zn.png" alt="Avatar"/>
                <Typography variant="h4">BD3</Typography>
                <div onClick={() => setSelectedMenu('Profile')}>Profile</div>
                <div onClick={() => setSelectedMenu('Partnership')}>Partnership</div>
                <div onClick={() => setSelectedMenu('Activities')}>Activities</div>

            </div>
            <div style={{ width: '80%', padding: '20px' }}>
                {selectedMenu === 'Profile' && <ProfilePanel
                    title={'Profile'}
                    isEditable={true}
                    chips={['DAO', 'Web3']}
                    projectName={'BD3'}
                    address={'0x111'}
                    websiteURL={'https://BD3.dao'}
                    twitterName={'BD3'}
                    projectDescription={'Find your fucking partner'}
                    videoTitle={'Show time'}
                    videoContent={'https://www.youtube.com/watch?v=gAjVmfQcffY'}
                    partnerImpression={'partner impression'} />}
                {selectedMenu === 'Partnership' && <Partnership partnerNum={100} partners={partnersData} />}
                {selectedMenu === 'Activities' && <NeedsPanel needs={needs} currentPage={'info'}/>}
            </div>
        </div>
    );
};

export default InfoPage;
