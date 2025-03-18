#!/usr/bin/env node

const path = require('path');

if (process.argv.length < 3) {
    console.log(`Usage: node ${path.basename(process.argv[1])} <module-name>`);
    process.exit(1);
}

const p = path.resolve(process.argv[2]);
let m = require(p);
console.log("loaded:", m)