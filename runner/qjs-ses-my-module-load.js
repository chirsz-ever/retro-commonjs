#!/usr/bin/env -S qjs --std

// Bellard's quickjs 2024-01-13 has some problems. It is recommended to use quickjs-ng.
// Please run with `--std` flag.

function debug(...args) {
    if (0)
        console.log(...args);
}

if (scriptArgs.length < 2) {
    console.log(`Usage: qjs ${scriptArgs[0]} <module-name>`);
    std.exit(1);
}

function dirname(p) {
    return p.substring(0, p.lastIndexOf("/"));
}

const _dirname = dirname(scriptArgs[0]);

debug('_dirname:', _dirname);

const load_cjs_stub_ = std.loadScript(_dirname + "/../load_cjs_stub.js");
if (typeof load_cjs_stub === "undefined") {
    debug("load_cjs_stub === undefined")
    globalThis.load_cjs_stub = load_cjs_stub_;
}

const load_cjs = (path) => load_cjs_stub(path, std.loadFile(path));

// workaround for ses
if (typeof console.error === "undefined") {
    console.error = (...args) => {
        std.err.printf("%s\n", args.map(String).join(''));
    };
}

import '../node_modules/ses/dist/ses.mjs';

// or you can
// load_cjs(_dirname + "/../node_modules/ses/dist/ses.cjs")

lockdown();

const resolve = load_cjs(_dirname + "/../dist/util/resolve.js").resolve;

debug("resolve:", resolve)

const makeModule = load_cjs(_dirname + "/../dist/module.js").makeModule;

debug("makeModule loaded", makeModule)

const [cwd, err] = os.getcwd();
if (err != 0) {
    throw new Error(`Failed to get current working directory: ${err}`);
}

debug("cwd:", cwd)

const c = new Compartment();

c.globalThis.console = console;

c.globalThis.Module = makeModule({
    isFile(path) {
        const [obj, err] = os.stat(path);
        return err === 0 && !!(obj.mode & os.S_IFREG);
    },
    isDirectory(path) {
        const [obj, err] = os.stat(path);
        return err === 0 && !!(obj.mode & os.S_IFDIR);
    },
    readFileSync(path, _encoding) {
        return std.loadFile(path);
    },
    resolve,
    modulePathResolve(_request, _parent) {
        throw new Error("Not implemented");
    },
    realpath(p) {
        const [str, err] = os.realpath(p);
        if (err) {
            throw new Error(`Failed to get realpath: ${p}`);
        }
        return str;
    },
    Function: c.globalThis.Function,
});

// debug("Module:", Module)
const p = resolve(cwd, scriptArgs[1]);
debug("p:", p)
// debug("Module._load:", Module._load)
let m = c.globalThis.Module._load(p, null);
console.log("loaded:", JSON.stringify(m))
