export type Partner = {
    avatar: string; // 这可以是一个图片URL
    name: string;
    chips: string[];
};

export type PartnershipProps = {
    partnerNum: number;
    partners: Partner[];
};
