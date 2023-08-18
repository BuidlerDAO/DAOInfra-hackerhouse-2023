import { Default } from 'components/layouts/Default';
import KOLNFTList from 'components/templates/KOLNFTList';
import type { NextPage } from 'next';

const KOL721NFTListPage: NextPage = () => {
  return (
    <Default pageName="KOLNFTList">
      <KOLNFTList />
    </Default>
  );
};

export default KOL721NFTListPage;