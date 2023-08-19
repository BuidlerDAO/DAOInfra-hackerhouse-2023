"use client"

import React from 'react';
import Grid from '@mui/material/Grid';
import ProfilePanel from "@/components/ProfilePanel/ProfilePanel";
import Partnership from "@/components/PartnerPanel/PartnerPanel";
import partnersData from '@/data/partner'
import styles from './index.module.scss'
import NeedsPanel from "@/components/NeedsPanel/NeedsPanel";
import needs from "@/data/needs";
import ReputationPanel from "@/components/ReputationPanel/ReputationPanel";
import Reputation from "@/data/reputation";
const ProfilePage: React.FC = () => {
    return (
        <Grid className={`p-4`} container spacing={3}>
            <Grid item xs={7} className={styles.LeftContainer}>
                <ProfilePanel
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
                    partnerImpression={'partner impression'} />
                <Partnership partnerNum={100} partners={partnersData} />
            </Grid>
            <Grid item xs={5} className={styles.LeftContainer}>
                <NeedsPanel needs={needs} currentPage={'profile'}/>
                <ReputationPanel reputationData={Reputation} />
            </Grid>
        </Grid>
    );
}

export default ProfilePage;
