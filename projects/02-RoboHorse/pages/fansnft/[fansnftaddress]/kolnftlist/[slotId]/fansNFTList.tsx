import { Default } from 'components/layouts/Default';
import FansNFTList from 'components/templates/FansNFTList';
import type { NextPage } from 'next';

const FansNFTListPage: NextPage = () => {
  return (
    <Default pageName="KOLNFTList">
      <FansNFTList />
    </Default>
  );
};

export default FansNFTListPage;