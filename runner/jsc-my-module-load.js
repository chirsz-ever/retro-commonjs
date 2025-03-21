#!/usr/bin/env jsc

function debug(...args) {
    if (0)
        __builtin.eprint(args.map(String).join(' ') + '\n');
}

console.log = (...args) => {
    __builtin.print(args.map(String).join(' ') + '\n');
}
console.error = (...args) => {
    __builtin.eprint(args.map(String).join(' ') + '\n');
}

if (__builtin.args.length < 2) {
    console.log(`Usage: jsc ${__builtin.args[0]} <module-name>`);
    new undefined;
}

function dirname(p) {
    return p.substring(0, p.lastIndexOf("/"));
}

const arg0 = __builtin.args[0];

const _dirname = dirname(arg0);

debug('_dirname:', _dirname);

const stub_content = __builtin.loadFile(_dirname + "/../load_cjs_stub.js");
const load_cjs_stub_ = eval(stub_content);
if (typeof load_cjs_stub === "undefined") {
    globalThis.load_cjs_stub = load_cjs_stub_;
}

const load_cjs = (path) => load_cjs_stub(path, __builtin.loadFile(path));

const resolve = load_cjs(_dirname + "/../dist/util/resolve.js").resolve;

const makeModule = load_cjs(_dirname + "/../dist/module.js").makeModule;

const cwd = __builtin.cwd();

// debug("cwd:", cwd)

const Module = makeModule({
    isFile(path) {
        return __builtin.isFile(path);
    },
    isDirectory(path) {
        return __builtin.isDirectory(path);
    },
    readFileSync(path, _encoding) {
        return __builtin.loadFile(path);
    },
    resolve,
    modulePathResolve(_request, _parent) {
        throw new Error("Not implemented");
    },
    realpath(p) {
        return __builtin.realPath(p);
    }
});

const p = resolve(cwd, __builtin.args[1]);
// debug("p:", p)
let m = Module._load(p, null);
console.log("loaded:", JSON.stringify(m))
