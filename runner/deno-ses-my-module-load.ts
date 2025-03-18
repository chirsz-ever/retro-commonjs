#!/usr/bin/env -S deno run --allow-read

import "ses"

import { existsSync } from "jsr:@std/fs";
import { resolve } from "../util/resolve.ts";

if (Deno.args.length < 1) {
    const name = Deno.mainModule.substring(Deno.mainModule.lastIndexOf('/') + 1);
    console.log(`Usage: deno ${name} <module-name>`);
    Deno.exit(1);
}

const cwd = Deno.cwd();

const moduleText = await Deno.readTextFile(new URL(import.meta.resolve("../dist/module.js")).pathname);
eval(moduleText);

const Module = makeModule({
    isFile(path) {
        return existsSync(path, { isFile: true });
    },
    isDirectory(path) {
        return existsSync(path, { isDirectory: true });
    },
    readFileSync(path, _encoding) {
        return Deno.readTextFileSync(path);
    },
    resolve: (...paths) => resolve({ cwd }, ...paths),
    modulePathResolve(_request, _parent) {
        throw new Error("Not implemented");
    },
    realpath(p) {
        return Deno.realPathSync(p);
    }
});

const c = new Compartment({
    globals: {
        console,
        Module,
    },
    __options__: true, // temporary migration affordance
});

const p = resolve({ cwd }, Deno.args[0]);
c.evaluate(`
    let m = Module._load(${JSON.stringify(p)}, null);
    console.log("loaded:", JSON.stringify(m));
`)
