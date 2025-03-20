#!/usr/bin/env qjs

import * as std from "std";
import * as os from "os";

function debug(...args) {
    if (0)
        console.log(...args);
}

try {
    if (scriptArgs.length < 2) {
        console.log(`Usage: qjs ${scriptArgs[0]} <module-name>`);
        std.exit(1);
    }

    function dirname(p) {
        return p.substring(0, p.lastIndexOf("/"));
    }

    const _dirname = dirname(scriptArgs[0]);

    debug('_dirname:', _dirname);

    const load_cjs_stub = std.loadScript(_dirname + "/../load_cjs_stub.js");

    const load_cjs = (path) => load_cjs_stub(path, std.loadFile(path));

    const resolve = load_cjs(_dirname + "/../dist/util/resolve.js").resolve;

    // debug("resolve:", resolve)

    const makeModule = load_cjs(_dirname + "/../dist/module.js").makeModule;

    // debug("makeModule loaded", makeModule)

    const [cwd, err] = os.getcwd();
    if (err != 0) {
        throw new Error(`Failed to get current working directory: ${err}`);
    }

    debug("cwd:", cwd)

    const Module = makeModule({
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
        }
    });

    // debug("Module:", Module)
    const p = resolve(cwd, scriptArgs[1]);
    debug("p:", p)
    // debug("Module._load:", Module._load)
    let m = Module._load(p, null);
    console.log("loaded:", JSON.stringify(m))
} catch (e) {
    console.error(e);
    console.error(e.stack);
}
