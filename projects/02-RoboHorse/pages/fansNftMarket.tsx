import { Default } from 'components/layouts/Default';
import ERC3525MarketList from 'components/templates/ERC3525MarketList';
import type { NextPage } from 'next';

const MarketListPage: NextPage = () => {
  return (
    <Default pageName="ERC3525MarketList">
      <ERC3525MarketList />
    </Default>
  );
};

export default MarketListPage;
