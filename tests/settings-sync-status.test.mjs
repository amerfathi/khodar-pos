import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

test('cloud screen reads the real pending count when opened without a new sync event', async () => {
  const bundle = await build({ entryPoints: ['src/components/SettingsView.jsx'], bundle: true,
    write: false, format: 'cjs', platform: 'node', define: { 'import.meta.env': '{}' },
    loader: { '.png': 'dataurl' }, external: ['react', 'react-dom', 'react-test-renderer'] });
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), loaded, loaded.exports);
  const priorFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 503 });
  const syncService = { isOnline: true, getQueueLength: () => 3, subscribe: () => () => {} };
  const store = { settings: {}, syncService, branches: [], users: [], currentUser: { id: 'owner', tenantId: 'matrix-tenant', role: 'company_owner', username: 'owner' } };
  let root;
  const flatten = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(flatten).join(' ') : node?.children ? flatten(node.children) : '';
  try {
    await act(async () => { root = TestRenderer.create(React.createElement(loaded.exports.default, { store })); });
    const profileText = flatten(root.toJSON());
    for (const currency of ['ريال سعودي', 'جنيه مصري', 'دينار ليبي', 'دولار أمريكي', 'يورو'])
      assert.ok(profileText.includes(currency), `Missing currency preset: ${currency}`);
    const cloud = root.root.findAllByType('button').find(node => flatten(node).includes('السحابة والنسخ الاحتياطي'));
    assert.ok(cloud);
    await act(async () => { cloud.props.onClick(); });
    assert.match(flatten(root.toJSON()), /تغييرات بانتظار المزامنة:\s*3/);
  } finally {
    await act(async () => { root?.unmount(); });
    globalThis.fetch = priorFetch;
  }
});
