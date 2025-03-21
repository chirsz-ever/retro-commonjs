#!/usr/bin/env node

const test = require('node:test');
const cp = require('node:child_process');
const assert = require('node:assert');

const promisify = require('node:util').promisify;
const exec = promisify(cp.exec);

test('load', async () => {
    async function testLoad(mod) {
        const tasks = [
            exec(`node "${__dirname}/../runner/node-load.js" "${mod}"`),
            exec(`node "${__dirname}/../runner/node-my-module-load.js" "${mod}"`),
            exec(`node "${__dirname}/../runner/node-ses-my-module-load.js" "${mod}"`),
        ];

        if (process.argv.includes("--test-deno")) {
            tasks.push(
                exec(`deno run -A "${__dirname}/../runner/deno-my-module-load.ts" "${mod}"`),
                exec(`deno run -A "${__dirname}/../runner/deno-ses-my-module-load.ts" "${mod}"`),
            );
        }

        if (process.argv.includes("--test-quickjs")) {
            tasks.push(
                exec(`qjs --std "${__dirname}/../runner/qjs-my-module-load.js" "${mod}"`),
                exec(`qjs --std "${__dirname}/../runner/qjs-ses-my-module-load.js" "${mod}"`),
            );
        }

        if (process.argv.includes("--test-jsc")) {
            tasks.push(
                exec(`jsc "${__dirname}/../runner/jsc-my-module-load.js" "${mod}"`),
                exec(`jsc "${__dirname}/../runner/jsc-ses-my-module-load.js" "${mod}"`),
            );
        }

        const results = (await Promise.all(tasks)).map(r => r.stdout);

        for (let i = 1; i < results.length; i++) {
            assert.strictEqual(results[0], results[i], `${mod} on index ${i}`);
        }
    }
    await testLoad(`${__dirname}/direct_require`);
    await testLoad(`${__dirname}/simple`);
    await testLoad(`${__dirname}/test-circle`);
    await testLoad(`${__dirname}/test-symlink`);
});
