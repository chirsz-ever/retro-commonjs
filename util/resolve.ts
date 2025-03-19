// if want `path.resolve`, use `resolve(process.cwd(), ...paths)`
export function resolve(...paths: string[]): string {
    var i = 0;
    for (i = 0; i < paths.length; ++i) {
        if (typeof paths[i] !== 'string') {
            throw new TypeError('The "paths[' + i + ']" argument must be of type string. Received type ' + typeof paths[i] + ' (' + paths[i] + ')');
        }
    }

    for (i = paths.length - 1; i >= 0 && paths[i][0] != '/'; --i) { }
    if (i < 0) {
        throw new Error('no absolute path found');
    }

    var segs = [];
    for (; i < paths.length; ++i) {
        for (const seg of paths[i].split('/')) {
            if (seg == '.' || seg == '') {
                continue;
            } else if (seg == '..') {
                segs.pop();
            } else {
                segs.push(seg);
            }
        }
    }

    var resolvedPath = '/' + segs.join('/');

    return resolvedPath;
}
