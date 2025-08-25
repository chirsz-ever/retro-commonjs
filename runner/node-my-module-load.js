#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

if (process.argv.length < 3) {
    console.log(`Usage: node ${path.basename(process.argv[1])} <module-name>`);
    process.exit(1);
}

const makeModule = require('..').makeModule;

const Module = makeModule({
    isFile(path) {
        return fs.existsSync(path) && fs.statSync(path).isFile();
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

const p = path.resolve(process.argv[2]);
let m = Module._load(p, null);
console.log("loaded:", JSON.stringify(m))
