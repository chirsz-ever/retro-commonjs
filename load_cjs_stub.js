var load_cjs_stub;
/**
 * You can load this file as script in browser, or read the content and eval it.
 * @param {string} path must be absolute path
 * @param {string} content must be string
 * @returns {*}
 */
load_cjs_stub = function load_cjs_stub(path, content, fn, err) {
    var fn_ = typeof fn == 'undefined' ? Function : fn;
    var err_ = typeof err == 'undefined' ? Error : err;
    var require = () => { throw new err_("Not implemented require in load_cjs_stub") };
    var module = { exports: {} };
    var __filename = path;
    var __dirname = path.indexOf("/") < 0 ? "." : path.replace(/\/[^\/]+\/*$/, "");
    var args = [module.exports, require, module, __filename, __dirname];
    fn_('exports', 'require', 'module', '__filename', '__dirname', content).apply(module.exports, args);
    return module.exports;
};
