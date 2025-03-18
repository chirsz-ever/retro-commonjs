interface ModuleConfig {
    isFile: (path: string) => boolean;
    isDirectory: (path: string) => boolean;
    readFileSync(path: string, encoding: 'utf8'): string;
    resolve(...paths: string[]): string;
}

function getModule(config: ModuleConfig) {

    // 参照 Node 20
    // https://nodejs.org/docs/latest-v20.x/api/module.html
    // https://nodejs.org/docs/latest-v20.x/api/modules.html
    // static 方法
    // - builtinModules
    // - createRequire(filename)
    // - module.isBuiltin(moduleName)
    // - register(specifier[, parentURL][, options]) // 不支持
    // - syncBuiltinESMExports() // 不支持
    // 成员属性
    // - module.children
    // - module.exports
    // - module.filename
    // - module.id
    // - module.isPreloading
    // - module.loaded
    // - module.parent
    // - module.path
    // - module.paths
    // - module.require(id)
    class Module {
        id: string;
        exports: any;
        parent: Module | null;
        filename: string | null;
        loaded: boolean;
        children: Module[];
        paths: string[] | undefined;

        static _cache: { [key: string]: Module } = {};

        static _extensions: { [key: string]: (module: Module, filename: string) => void } = {
            '.js': function (module, filename) {
                module._compile(stripBOM(config.readFileSync(filename, 'utf8')), filename);
            },
            '.json': function (module, filename) {
                var content = config.readFileSync(filename, 'utf8');
                try {
                    module.exports = JSON.parse(stripBOM(content));
                } catch (err) {
                    (err as any).message = filename + ': ' + (err as any).message;
                    throw err;
                }
            },
            '.node': function (module, filename) {
                // module.exports = process.dlopen(module, path.basename(filename, '.node'));
                throw new Error('not implemented');
            }
        };

        static builtInModules: string[] = [
            "module",
            "path",
            "fs",
        ];

        static _mainModule: Module;

        static isBuiltin(moduleName: string): boolean {
            return Module.builtInModules.includes(moduleName) || moduleName.startsWith("node:") && Module.builtInModules.includes(moduleName.substring(5));
        }

        constructor(id: string = '', parent: Module | null) {
            this.id = id;
            this.exports = {};
            this.parent = parent;
            this.filename = null;
            this.loaded = false;
            this.children = [];
        }

        require(id: string): any {
            return Module._load(id, this);
        }

        static _load(request: string, parent: Module | null, isMain?: boolean): any {
            // built-in modules
            if (Module.isBuiltin(request)) {
                return loadBuiltinModule(request);
            }

            // 计算绝对路径
            var filename = Module._resolveFilename(request, parent);

            // 查找缓存
            var cachedModule = Module._cache[filename];
            if (cachedModule) {
                return cachedModule.exports;
            }

            // 生成模块实例，存入缓存
            var module = new Module(filename, parent);
            Module._cache[filename] = module;

            if (isMain) {
                Module._mainModule = module;
            }

            // 加载模块
            var hadException = true;
            try {
                module.load(filename);
                hadException = false;
            } finally {
                if (hadException) {
                    delete Module._cache[filename];
                }
            }

            return module.exports;
        }

        static _resolveFilename(request: string, parent: Module | null): string {
            // 如果是内置模块，不含路径返回
            if (Module.isBuiltin(request)) {
                return request;
            }

            var filename: string | undefined | null;

            // 相对和绝对路径
            if (request.startsWith('./') || request.startsWith('../') || request.startsWith('/')) {
                var fullName = config.resolve(dirname(parent?.filename || '.'), request);

                if (filename = load_as_file(fullName)) {
                    return filename;
                }

                if (filename = load_as_directory(fullName)) {
                    return filename;
                }

                throw new Error("Cannot find module '" + request + "'");
            }

            if (request.startsWith('#')) {
                throw new Error("not support package imports");
            }

            // 第二步：确定所有可能的路径
            var resolvedModule = Module._resolveLookupPaths(request, parent);
            var id = resolvedModule[0];
            var paths = resolvedModule[1];

            // 第三步：确定哪一个路径为真
            filename = Module._findPath(request, paths);
            if (!filename) {
                var err = new Error("Cannot find module '" + request + "'");
                (err as any).code = 'MODULE_NOT_FOUND';
                throw err;
            }
            return filename;
        };

        static _resolveLookupPaths(request: string, parent: Module | null): [string, string[]] {
            if (Module.isBuiltin(request)) {
                return [request, []];
            }

            var start = request.substring(0, 2);
            if (start !== './' && start !== '..') {
                var paths: string[] = modulePaths;
                if (parent) {
                    if (!parent.paths) parent.paths = [];
                    paths = parent.paths.concat(paths);
                }
                return [request, paths];
            }

            // with --eval, parent.id is not set and parent.filename is null
            if (!parent || !parent.id || !parent.filename) {
                // make require('./path/to/foo') work - normally the path is taken
                // from realpath(__filename) but with eval there is no filename
                var mainPaths = ['.'].concat(modulePaths);
                mainPaths = Module._nodeModulePaths('.').concat(mainPaths);
                return [request, mainPaths];
            }

            // Is the parent an index module?
            // We can assume the parent has a valid extension,
            // as it already has been accepted as a module.
            var isIndex = /\/index\.\w+?$/.test(parent.filename);
            var parentIdPath = isIndex ? parent.id : dirname(parent.id);
            var id = config.resolve(parentIdPath, request);

            // make sure require('./path') and require('path') get distinct ids, even
            // when called from the toplevel js file
            if (parentIdPath === '.' && id.indexOf('/') === -1) {
                id = './' + id;
            }

            return [id, [dirname(parent.filename)]];
        }

        static _nodeModulePaths(from: string): string[] {
            from = config.resolve(from);
            var paths: string[] = [];
            var parts = from.split('/');

            for (var tip = parts.length - 1; tip >= 0; tip--) {
                // don't search in .../node_modules/node_modules
                if (parts[tip] === 'node_modules') continue;
                var dir = parts.slice(0, tip + 1).concat('node_modules').join('/');
                paths.push(dir);
            }

            return paths;
        }

        static _findPath(request: string, paths: string[]): string | null {
            var filename: string | undefined;
            for (var p of paths) {
                var p1 = p + '/' + request;
                if (filename = load_as_file(p1)) {
                    return filename;
                }
                if (filename = load_as_directory(p1)) {
                    return filename;
                }
            }
            return null;
        }

        _compile(content: string, filename: string): void {
            var self = this;
            // remove shebang
            content = content.replace(/^\#\!.*/, '');

            function require(path: string) {
                return self.require(path);
            }
            require.resolve = function (request: string) {
                return Module._resolveFilename(request, self);
            };

            require.main = Module._mainModule;

            require.extensions = Module._extensions;

            require.cache = Module._cache;

            const mod_func = Function('exports', 'require', 'module', '__filename', '__dirname', content);
            const mod__dirname = dirname(filename);
            var args = [self.exports, require, self, filename, mod__dirname];
            return mod_func.apply(self.exports, args);
        }

        static createRequire(filename: string): (id: string) => any {
            var m = new Module(filename, null);
            return m.require.bind(m);
        }

        static register() {
            throw new Error('Module.register is not implemented');
        }

        static syncBuiltinESMExports() {
            // do nothing
            // throw new Error('Module.syncBuiltinESMExports is not implemented');
        }

        load(filename: string) {
            this.filename = filename;
            this.paths = Module._nodeModulePaths(dirname(filename));
            var extension = extname(filename) || '.js';
            if (!Module._extensions[extension]) extension = '.js';
            Module._extensions[extension](this, filename);
            this.loaded = true;
        };
    }

    function loadBuiltinModule(moduleName: string): any {
        if (moduleName === 'module') {
            return Module;
        }
        throw new Error('not implemented');
    }

    function stripBOM(content: string): string {
        // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
        // because the buffer-to-string conversion in `fs.readFileSync()`
        // translates it to FEFF, the UTF-16 BOM.
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        return content;
    }

    function load_as_file(x: string): string | undefined {
        if (config.isFile(x)) {
            return x;
        }
        if (config.isFile(x + '.js')) {
            return x + '.js';
        }
        if (config.isFile(x + '.json')) {
            return x + '.json';
        }
        if (config.isFile(x + '.node')) {
            return x + '.node';
        }
    }

    function load_as_directory(x: string): string | undefined {
        var pkgPath = x + '/package.json';
        var filename;
        if (config.isFile(pkgPath)) {
            let pkg = JSON.parse(config.readFileSync(pkgPath, 'utf8'));
            if (typeof pkg != 'object') {
                throw new Error('Invalid package.json at ' + pkgPath);
            }
            if (pkg.main) {
                let m = config.resolve(x, pkg.main);
                if (filename = load_as_file(m)) {
                    return filename;
                }
                if (filename = load_index(m)) {
                    return filename;
                }
                // deprecated
                if (filename = load_index(x)) {
                    return filename;
                }
                throw new Error('not implemented');
            }
        }
        if (filename = load_index(x)) {
            return filename;
        }
    }

    function load_index(x: string): string | undefined {
        if (config.isFile(x + '/index.js')) {
            return x + '/index.js';
        }
        if (config.isFile(x + '/index.json')) {
            return x + '/index.json';
        }
        if (config.isFile(x + '/index.node')) {
            return x + '/index.node';
        }
    }

    function extname(x: string): string {
        var i = x.lastIndexOf('.');
        return i <= 0 ? '' : x.substring(i);
    }

    function dirname(path: string): string {
        if (path.length === 0) {
            // 如果输入为空字符串，返回当前目录（'.'）
            return '.';
        }

        // 将多个连续的 '/' 合并为单个 '/'
        path = path.replace(/\/+/g, '/');

        // 去除路径末尾的分隔符（如果有），除非路径是根目录 '/'
        if (path !== '/') {
            while (path.endsWith('/')) {
                path = path.slice(0, -1);
            }
        }

        // 找到最后一个路径分隔符的位置
        const lastSeparatorIndex = path.lastIndexOf('/');

        if (lastSeparatorIndex === -1) {
            // 如果没有路径分隔符，返回当前目录（'.'）
            return '.';
        }

        if (lastSeparatorIndex === 0) {
            // 如果路径分隔符在开头（例如 '/usr'），返回根目录 '/'
            return '/';
        }

        return path.slice(0, lastSeparatorIndex);
    }

    var modulePaths: string[] = [];

    return Module;
};

globalThis.getModule = getModule;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = getModule;
}
