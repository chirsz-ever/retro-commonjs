import { dirname } from '../util/dirname';
import { resolve as resolve_ } from '../util/resolve';

function resolve(...paths: string[]): string {
    return resolve_(process.cwd(), ...paths);
}

import assert = require('node:assert');
import path = require('node:path');
const test = require('node:test');

test('dirname', () => {
    function testDirname(input: string) {
        assert.strictEqual(dirname(input), path.dirname(input));
    }
    testDirname('');
    testDirname('a');
    testDirname('a/b');
    testDirname('a/b/');
    testDirname('a/b/c');
    testDirname('a/b/c/');
    testDirname('a/b/c/d');

    testDirname('a/b/../d');

    testDirname('.');
    testDirname('..');
    testDirname('...');
    testDirname('....');

    testDirname('../')
    testDirname('../.')
    testDirname('../..')

    testDirname('/.')

    testDirname('/')
    testDirname('//')
    testDirname('///')
    testDirname('////')
    testDirname('/////')
});

test('resolve', () => {
    function testResolve(...inputs: string[]) {
        assert.strictEqual(resolve(...inputs), path.resolve(...inputs));
    }

    const paths = [
        '',
        '.',
        '..',
        '/',
        '//',
        'a',
        './a',
        './a/b',
        '/a',
        '//a/b',
        '../a',
        './a/..',
        '../a/b',
        './a/../b',
    ];

    for (const p of paths) {
        console.log(`testing resolve('${p}')`);
        testResolve(p);
    }

    for (const p1 of paths) {
        for (const p2 of paths) {
            console.log(`testing resolve("${p1}", "${p2}")`);
            testResolve(p1, p2);
        }
    }
});
