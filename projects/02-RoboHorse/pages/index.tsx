import { Default } from 'components/layouts/Default';
import { Introduce } from 'components/templates/introduce';
import type { NextPage } from 'next';

const HomePage: NextPage = () => {
  return (
    <Default pageName="Home">
      <Introduce />
    </Default>
  );
};

export default HomePage;
