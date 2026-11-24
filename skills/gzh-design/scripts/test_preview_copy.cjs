const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const template = fs.readFileSync(path.join(__dirname, '../assets/preview-template.html'), 'utf8');
const source = template.match(/<script>([\s\S]*?)<\/script>/)[1];
// 两端都有无文本装饰，复制不能依赖它们是否贡献innerText。
const html = '<section style="text-align:left"><span style="width:8px;height:8px;background:#4267B4"><br></span>' +
  '<p><span leaf="">正文</span></p><span style="border:1px solid blue"><br></span></section>';

function harness(mode = 'normal', align = 'left') {
  const listeners = new Set();
  const data = {};
  const content = { innerHTML: html, innerText: '正文', querySelectorAll: () => [] };
  const elements = {
    'gzh-content': content,
    gzhCopyBtn: { textContent: '复制到公众号' },
    gzhToast: { textContent: '', classList: { add() {} } },
  };
  const state = { commands: 0, clears: 0, prevented: false };
  const context = {
    document: {
      getElementById: id => elements[id],
      createRange: () => ({ selectNodeContents(el) { assert.equal(el, content); } }),
      addEventListener(type, handler) { assert.equal(type, 'copy'); listeners.add(handler); },
      removeEventListener(type, handler) { assert.equal(type, 'copy'); listeners.delete(handler); },
      execCommand(command) {
        assert.equal(command, 'copy'); state.commands++;
        if (mode === 'throw') throw new Error('clipboard unavailable');
        const event = {
          clipboardData: mode === 'no-data' ? null : { setData(type, value) { data[type] = value; } },
          preventDefault() { state.prevented = true; },
        };
        for (const handler of listeners) handler(event);
        return true;
      },
    },
    window: { getSelection: () => ({ removeAllRanges() { state.clears++; }, addRange() {} }) },
    getComputedStyle: () => ({ textAlign: align, backgroundImage: 'none' }),
    setTimeout: () => 0,
    clearTimeout() {},
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  context.gzhCopy();
  return { data, state, listeners, toast: elements.gzhToast.textContent };
}

test('copy preserves the exact HTML including leading and trailing empty decorations', () => {
  const result = harness();
  assert.equal(result.data['text/html'], html);
  assert.equal(result.data['text/plain'], '正文');
  assert.equal(result.state.prevented, true);
  assert.equal(result.state.commands, 1);
  assert.equal(result.listeners.size, 0);
  assert.match(result.toast, /已复制/);
});

test('a successful native command without our payload is not reported as success', () => {
  const result = harness('no-data');
  assert.equal(result.listeners.size, 0);
  assert.deepEqual(result.data, {});
  assert.doesNotMatch(result.toast, /已复制/);
  assert.doesNotMatch(result.toast, /手动全选/);
});

test('a failing clipboard command removes its listener and selection', () => {
  const result = harness('throw');
  assert.equal(result.listeners.size, 0);
  assert.equal(result.state.clears, 2);
  assert.doesNotMatch(result.toast, /已复制/);
});

test('compatibility warnings still block copying', () => {
  const result = harness('normal', 'start');
  assert.equal(result.state.commands, 0);
  assert.equal(result.listeners.size, 0);
  assert.match(result.toast, /start/);
});
