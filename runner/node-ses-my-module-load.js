#!/usr/bin/env node

require('ses');

lockdown();

const path = require('path');
const fs = require('fs');

if (process.argv.length < 3) {
    console.log(`Usage: node ${path.basename(process.argv[1])} <module-name>`);
    process.exit(1);
}

const c = new Compartment({
    globals: {
        console,
    },
    __options__: true, // temporary migration affordance
});

// must evaluate in a compartment
// const makeModule = c.evaluate(fs.readFileSync(path.resolve(__dirname, '../dist/module.js'), 'utf8'));
// or provide the Function

const makeModule = require("..").makeModule;

c.globalThis.Module = makeModule({
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
    },
    Function: c.globalThis.Function,
});

const p = path.resolve(process.argv[2]);
c.evaluate(`
let m = Module._load(${JSON.stringify(p)}, null);
console.log("loaded:", JSON.stringify(m));
`)
