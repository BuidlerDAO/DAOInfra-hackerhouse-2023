import { Default } from 'components/layouts/Default';
import { RPCList } from 'components/templates/config/rpc';
import type { NextPage } from 'next';

const RPCListPage: NextPage = () => {
  return (
    <Default pageName="RPCList">
      <RPCList />
    </Default>
  );
};

export default RPCListPage;
