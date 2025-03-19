#!/usr/bin/env -S deno run --allow-read

import { existsSync } from "jsr:@std/fs";
import { resolve } from "../util/resolve.ts";

if (Deno.args.length < 1) {
    const name = Deno.mainModule.substring(Deno.mainModule.lastIndexOf('/') + 1);
    console.log(`Usage: deno ${name} <module-name>`);
    Deno.exit(1);
}

const cwd = Deno.cwd();

const moduleText = await Deno.readTextFile(new URL(import.meta.resolve("../dist/module.js")).pathname);
const makeModule = eval(moduleText);

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
    resolve,
    modulePathResolve(_request, _parent) {
        throw new Error("Not implemented");
    },
    realpath(p) {
        return Deno.realPathSync(p);
    }
});

const p = resolve(cwd, Deno.args[0]);
const m = Module._load(p, null);
console.log("loaded:", JSON.stringify(m))
