/**
 * @param {string} path
 * @param {string} content
 * @returns {*}
 */
function load_cjs_stub(path, content) {
    const require = () => { throw new Error("Not implemented require in load_cjs_stub") };
    const module = { exports: {} };
    const __filename = path;
    const __dirname = path.includes("/") ? path.replace(/\/[^\/]+\/*$/, "") : ".";
    const args = [module.exports, require, module, __filename, __dirname];
    Function('exports', 'require', 'module', '__filename', '__dirname', content).apply(module.exports, args);
    return module.exports;
}

// for eval
load_cjs_stub;
