import { Default } from 'components/layouts/Default';
import { ScriptEditor } from 'components/templates/script/editor';
import type { NextPage } from 'next';

const ScriptEditorPage: NextPage = () => {
  return (
    <Default pageName="ScriptEditor">
      <ScriptEditor />
    </Default>
  );
};

export default ScriptEditorPage;
