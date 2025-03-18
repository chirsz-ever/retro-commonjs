function dirname(path: string): string {
    if (path.length === 0) {
        // 如果输入为空字符串，返回当前目录（'.'）
        return '.';
    }

    // 将多个连续的 '/' 合并为单个 '/'
    path = path.replace(/\/+/g, '/');

    // 去除路径末尾的分隔符（如果有），除非路径是根目录 '/'
    if (path !== '/') {
        while (path.endsWith('/')) {
            path = path.slice(0, -1);
        }
    }

    // 找到最后一个路径分隔符的位置
    const lastSeparatorIndex = path.lastIndexOf('/');

    if (lastSeparatorIndex === -1) {
        // 如果没有路径分隔符，返回当前目录（'.'）
        return '.';
    }

    if (lastSeparatorIndex === 0) {
        // 如果路径分隔符在开头（例如 '/usr'），返回根目录 '/'
        return '/';
    }

    return path.slice(0, lastSeparatorIndex);
}

function resolve(...paths: string[]): string {
    let resolvedPath = paths.reduce((acc, path) => {
        if (path.startsWith('/')) {
            // 如果路径是绝对路径，直接使用该路径
            return path;
        }
        // 否则将路径拼接到当前路径
        return `${acc}/${path}`;
    }, process.cwd());

    // 规范化路径，去除多余的斜杠, 尾随斜杠和相对路径
    resolvedPath = resolvedPath.replace(/\/+/g, '/');
    resolvedPath = new URL(`file://${resolvedPath}`).pathname;
    if (resolvedPath !== '/' && resolvedPath.endsWith('/')) {
        resolvedPath = resolvedPath.slice(0, -1);
    }

    // 在 Windows 上，路径会以 `/` 开头，需要去掉
    if (process.platform === 'win32' && resolvedPath.startsWith('/')) {
        resolvedPath = resolvedPath.slice(1);
    }

    return resolvedPath;
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
