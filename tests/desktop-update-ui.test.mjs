import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

test('Windows update UI displays failed installer acknowledgement', async () => {
  const bundle = await build({ entryPoints: ['src/components/DesktopUpdateModal.jsx'], bundle: true,
    write: false, format: 'cjs', platform: 'node', define: { 'import.meta.env': '{}' },
    external: ['react', 'react-dom', 'react-test-renderer'] });
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), loaded, loaded.exports);
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: { electronAPI: {
    downloadUpdate: async () => ({ success: true, filePath: 'verified-installer.exe' }),
    installUpdate: async () => ({ success: false, error: 'Injected installer failure' })
  } } });
  let root;
  const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join(' ') : node?.children ? text(node.children) : '';
  const click = label => root.root.findAllByType('button').find(node => text(node).includes(label)).props.onClick();
  try {
    await act(async () => { root = TestRenderer.create(React.createElement(loaded.exports.default, {
      isOpen: true, onClose() {}, releaseInfo: { isUpdateAvailable: true, latestVersion: '2.6.5' }
    })); });
    await act(async () => { await click('تحميل التحديث وتثبيته الآن'); });
    assert.match(text(root.toJSON()), /فتح مُثبّت التحديث/);
    await act(async () => { await click('فتح مُثبّت التحديث'); });
    assert.match(text(root.toJSON()), /Injected installer failure/);
  } finally {
    await act(async () => { root?.unmount(); });
    globalThis.window = previousWindow;
  }
});

test('Windows update keeps the app open until the user sees the installer', async () => {
  const bundle = await build({ entryPoints: ['src/components/DesktopUpdateModal.jsx'], bundle: true,
    write: false, format: 'cjs', platform: 'node', define: { 'import.meta.env': '{}' },
    external: ['react', 'react-dom', 'react-test-renderer'] });
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), loaded, loaded.exports);
  const previousWindow = globalThis.window;
  let closeCount = 0;
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: { electronAPI: {
    downloadUpdate: async () => ({ success: true, filePath: 'verified-installer.exe' }),
    installUpdate: async () => ({ success: true }),
    close: () => { closeCount += 1; }
  } } });
  let root;
  const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join(' ') : node?.children ? text(node.children) : '';
  const click = label => root.root.findAllByType('button').find(node => text(node).includes(label)).props.onClick();
  try {
    await act(async () => { root = TestRenderer.create(React.createElement(loaded.exports.default, {
      isOpen: true, onClose() {}, releaseInfo: { isUpdateAvailable: true, latestVersion: '2.6.7' }
    })); });
    await act(async () => { await click('تحميل التحديث وتثبيته الآن'); });
    await act(async () => { await click('فتح مُثبّت التحديث'); });
    assert.equal(closeCount, 0);
    assert.match(text(root.toJSON()), /تأكد من ظهور نافذة التثبيت/);
    await act(async () => { click('إغلاق براكه ومتابعة التثبيت'); });
    assert.equal(closeCount, 1);
  } finally {
    await act(async () => { root?.unmount(); });
    globalThis.window = previousWindow;
  }
});
