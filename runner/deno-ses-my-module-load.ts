#!/usr/bin/env -S deno run --allow-read --allow-env

import "ses"

import { existsSync } from "jsr:@std/fs";
import { resolve } from "../util/resolve.ts";
import makeModule from "../module.ts";

if (Deno.args.length < 1) {
    const name = Deno.mainModule.substring(Deno.mainModule.lastIndexOf('/') + 1);
    console.log(`Usage: deno ${name} <module-name>`);
    Deno.exit(1);
}

lockdown();

const c = new Compartment({
    globals: {
        console,
    },
    __options__: true, // temporary migration affordance
});

const cwd = Deno.cwd();

c.globalThis.Module = makeModule({
    isFile(path) {
        return existsSync(path, { isFile: true });
    },
    readFileSync(path, _encoding) {
        return Deno.readTextFileSync(path);
    },
    resolve,
    modulePathResolve(_request, _parent) {
        throw new Error("Not implemented");
    },
    realpath(p) {
        return Deno.realPathSync(p);
    },
    Function: c.globalThis.Function,
});

const p = resolve(cwd, Deno.args[0]);
c.evaluate(`
    let m = Module._load(${JSON.stringify(p)}, null);
    console.log("loaded:", JSON.stringify(m));
`)
