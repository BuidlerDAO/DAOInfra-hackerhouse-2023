export type Need = {
    avatar: string;
    name: string;
    status: 'green' | 'red' | 'gray';
    time: string;
    chip: string;
};

export type NeedsProps = {
    needs: Need[];
    currentPage: 'profile' | 'info';
};
