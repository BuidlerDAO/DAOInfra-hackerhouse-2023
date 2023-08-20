import { Default } from 'components/layouts/Default';
import FansNFTContractList from 'components/templates/FansNFTContractList';
import type { NextPage } from 'next';

const FansNFTContractListPage: NextPage = () => {
  return (
    <Default pageName="FansNFTContractList">
      <FansNFTContractList />
    </Default>
  );
};

export default FansNFTContractListPage;
