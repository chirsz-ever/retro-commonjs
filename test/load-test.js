#!/usr/bin/env node

const test = require('node:test');
const cp = require('node:child_process');
const assert = require('node:assert');

const promisify = require('node:util').promisify;
const exec = promisify(cp.exec);

test('load', async () => {
    async function testLoad(mod) {
        const results = await Promise.all([
            exec(`node "${__dirname}/../runner/node-load.js" "${mod}"`).toString('utf-8'),
            exec(`node "${__dirname}/../runner/node-my-module-load.js" "${mod}"`).toString('utf-8'),
            exec(`deno run -A "${__dirname}/../runner/deno-my-module-load.ts" "${mod}"`).toString('utf-8'),
            exec(`qjs "${__dirname}/../runner/qjs-my-module-load.js" "${mod}"`).toString('utf-8'),
            exec(`node "${__dirname}/../runner/node-ses-my-module-load.js" "${mod}"`).toString('utf-8'),
            exec(`deno run -A "${__dirname}/../runner/deno-ses-my-module-load.ts" "${mod}"`).toString('utf-8'),
        ]);

        for (let i = 1; i < results.length; i++) {
            assert.strictEqual(results[0], results[i], `${mod} on index ${i}`);
        }
    }
    await testLoad(`${__dirname}/direct_require`);
    await testLoad(`${__dirname}/simple`);
    await testLoad(`${__dirname}/test-circle`);
    await testLoad(`${__dirname}/test-symlink`);
});
