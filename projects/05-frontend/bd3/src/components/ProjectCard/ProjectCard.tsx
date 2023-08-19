import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { MediaCardProps, CardsListProps } from '@/Types/MediaCard';
import {Chip} from "@mui/material";
import styles from './index.module.scss';
import Link from "next/link";

const MediaCard:React.FC<MediaCardProps> = ({ image, title, chips, type, network, twitterName,  heading, description }) => {
    return (
        <Link href={'/info'}>
            <Card className={styles.MediaCardItem} sx={{ maxWidth: 345 }}>
                <CardMedia
                    sx={{ height: 140 }}
                    image={image}
                    title={title}
                />
                <CardContent className={styles.CardContentContainer}>
                    <Typography gutterBottom variant="h5" component="div">
                        {heading}
                    </Typography>
                    <div>
                        {chips.map((chipData, index) => (
                            <Chip size="small" key={index} label={chipData} style={{ margin: '0 8px 4px 0' }} />
                        ))}
                    </div>
                    <Typography gutterBottom variant="body1" component="div">
                        {type}
                    </Typography>
                    <Typography gutterBottom variant="body1" component="div">
                        {network}
                    </Typography>
                    <Typography gutterBottom variant="body1" component="div">
                        {twitterName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                </CardContent>
            </Card>
        </Link>
    );
}

const CardsList:React.FC<CardsListProps> = ({ cardsData }) => {
    return (
        <div className={`flex ${styles.cardListContainer}`}>
            {cardsData.map((card, index) => (
                <MediaCard
                    key={index}
                    image={card.image}
                    chips={card.chips}
                    type={card.type}
                    twitterName={card.twitterName}
                    network={card.network}
                    title={card.title}
                    heading={card.heading}
                    description={card.description}
                />
            ))}
        </div>
    );
}

export default CardsList
