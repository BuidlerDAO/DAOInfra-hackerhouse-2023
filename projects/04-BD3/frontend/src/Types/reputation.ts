export type ReputationItem = {
    avatar: string;
    projectName: string;
    chips: string[];
    comments: string;
};

export type ReputationProps = {
    reputationData: ReputationItem[];
};
