import { Default } from 'components/layouts/Default';
import { ScriptMarket } from 'components/templates/script/market';
import type { NextPage } from 'next';

const ScriptMarketPage: NextPage = () => {
  return (
    <Default pageName="ScriptMarket">
      <ScriptMarket />
    </Default>
  );
};

export default ScriptMarketPage;
