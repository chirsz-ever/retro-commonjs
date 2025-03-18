#!/usr/bin/env node

require('ses');

const path = require('path');
const fs = require('fs');

if (process.argv.length < 3) {
    console.log(`Usage: node ${path.basename(process.argv[1])} <module-name>`);
    process.exit(1);
}

const makeModule = require('..');

const Module = makeModule({
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
    modulePathResolve(_request, _parent) {
        throw new Error("Not implemented");
    },
    realpath(p) {
        return fs.realpathSync(p);
    }
});

const c = new Compartment({
    globals: {
        console,
        Module,
    },
    __options__: true, // temporary migration affordance
});

const p = path.resolve(process.argv[2]);
c.evaluate(`
let m = Module._load(${JSON.stringify(p)}, null);
console.log("loaded:", JSON.stringify(m));
`)
