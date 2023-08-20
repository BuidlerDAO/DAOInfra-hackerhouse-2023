import { Default } from 'components/layouts/Default';
import { ScriptList } from 'components/templates/script/mine';
import type { NextPage } from 'next';

const ScriptListPage: NextPage = () => {
  return (
    <Default pageName="ScriptList">
      <ScriptList />
    </Default>
  );
};

export default ScriptListPage;
