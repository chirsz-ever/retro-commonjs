#!/usr/bin/env node

const test = require('node:test');
const cp = require('node:child_process');
const assert = require('node:assert');

test('load', () => {
    function testLoad(mod) {
        const t1 = cp.execSync(`node "${__dirname}/../runner/node-load.js" "${mod}"`).toString('utf-8');
        const t2 = cp.execSync(`node "${__dirname}/../runner/node-my-module-load.js" "${mod}"`).toString('utf-8');
        const t3 = cp.execSync(`deno run -A "${__dirname}/../runner/deno-my-module-load.ts" "${mod}"`).toString('utf-8');
        const t4 = cp.execSync(`qjs "${__dirname}/../runner/qjs-my-module-load.js" "${mod}"`).toString('utf-8');
        assert.strictEqual(t1, t2);
        assert.strictEqual(t1, t3);
        assert.strictEqual(t1, t4);
    }
    testLoad(`${__dirname}/direct_require`);
    testLoad(`${__dirname}/simple`);
    testLoad(`${__dirname}/test-circle`);
    testLoad(`${__dirname}/test-symlink`);
});