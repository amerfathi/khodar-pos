import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
const bundle=await build({entryPoints:['src/components/ConflictReviewPanel.jsx'],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',define:{'import.meta.env':'{}'}});
const loaded={exports:{}};
new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),loaded,loaded.exports);
const Panel=loaded.exports.default;
test('owner review panel uses honest pending-reconciliation copy and explicit manual loading',()=>{
  const html=renderToStaticMarkup(React.createElement(Panel,{user:{id:'owner',tenantId:'A',role:'company_owner',isStaff:false}}));
  assert.match(html,/مراجعة تعارضات البيانات/);
  assert.match(html,/تحميل المراجعات/);
  assert.match(html,/لا يُطبق الاختيار على الأرصدة/);
  assert.doesNotMatch(html,/تم حل التعارض/);
});
test('staff and delegated administrators do not receive owner decision controls',()=>{
  for(const user of [{role:'cashier'},{role:'admin'},{role:'company_owner',isStaff:true},null])
    assert.equal(renderToStaticMarkup(React.createElement(Panel,{user})),'');
});
