#!/usr/bin/env node

if (process.argv.length < 3) {
    console.log('Usage: node require-test.js <module-name>');
    process.exit(1);
}

const getModule = require('.');

const path = require('path');
const fs = require('fs');

const Module = getModule({
    isFile(path) {
        return fs.existsSync(path) && fs.statSync(path).isFile();
    },
    isDirectory(path) {
        return fs.existsSync(path) && fs.statSync(path).isDirectory();
    },
    readFileSync(path, encoding) {
        return fs.readFileSync(path, encoding);
    },
    resolve(...paths) {
        return path.resolve(...paths);
    },
});

const p = path.resolve(process.argv[2]);
let m = Module._load(p, null);
console.log("loaded:", m)
