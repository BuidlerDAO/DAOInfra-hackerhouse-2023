import { Default } from 'components/layouts/Default';
import { LocalWallet } from 'components/templates/config/wallet';
import type { NextPage } from 'next';

const LocalWalletPage: NextPage = () => {
  return (
    <Default pageName="LocalWallet">
      <LocalWallet />
    </Default>
  );
};

export default LocalWalletPage;
