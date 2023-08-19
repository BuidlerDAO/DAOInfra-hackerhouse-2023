export type MediaCardChipList = string[]

export type CardData = {
    image: string;
    title: string;
    type: string,
    twitterName: string,
    network: string,
    chips: MediaCardChipList
    heading: string;
    description: string;
};

export type MediaCardProps = CardData;

export type CardsListProps = {
    cardsData: CardData[];
};
