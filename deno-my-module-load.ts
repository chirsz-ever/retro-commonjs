#!/usr/bin/env -S deno run --allow-read

import { existsSync } from "jsr:@std/fs";
import makeModule from "./dist/module.js";

if (Deno.args.length < 1) {
    const name = Deno.mainModule.substring(Deno.mainModule.lastIndexOf('/') + 1);
    console.log(`Usage: deno ${name} <module-name>`);
    Deno.exit(1);
}

function resolve(...paths: string[]): string {
    let resolvedPath = paths.reduce((acc, path) => {
        if (path.startsWith('/')) {
            // 如果路径是绝对路径，直接使用该路径
            return path;
        }
        // 否则将路径拼接到当前路径
        return `${acc}/${path}`;
    }, Deno.cwd());

    // 规范化路径，去除多余的斜杠, 尾随斜杠和相对路径
    resolvedPath = resolvedPath.replace(/\/+/g, '/');
    resolvedPath = new URL(`file://${resolvedPath}`).pathname;
    if (resolvedPath !== '/' && resolvedPath.endsWith('/')) {
        resolvedPath = resolvedPath.slice(0, -1);
    }

    // 在 Windows 上，路径会以 `/` 开头，需要去掉
    if (Deno.build.os === 'windows' && resolvedPath.startsWith('/')) {
        resolvedPath = resolvedPath.slice(1);
    }

    return resolvedPath;
}

const moduleText = await Deno.readTextFile("./dist/module.js");
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
    resolve,
    modulePathResolve(_request, _parent) {
        throw new Error("Not implemented");
    },
    realpath(p) {
        return Deno.realPathSync(p);
    }
});

const p = resolve(Deno.args[0]);
const m = Module._load(p, null);
console.log("loaded:", m)
