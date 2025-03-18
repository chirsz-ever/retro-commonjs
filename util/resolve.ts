export function resolve(option: { cwd: string, isWin32?: boolean }, ...paths: string[]): string {
    let resolvedPath = paths.reduce((acc, path) => {
        if (path.startsWith('/')) {
            // 如果路径是绝对路径，直接使用该路径
            return path;
        }
        // 否则将路径拼接到当前路径
        return `${acc}/${path}`;
    }, option.cwd);

    // 去除多余的斜杠
    resolvedPath = resolvedPath.replace(/\/+/g, '/');

    // 规范化路径
    const startRoot = resolvedPath.startsWith('/');
    const segs = resolvedPath.split('/');
    for (let i = 0; i < segs.length; i++) {
        if (segs[i] === '.') {
            segs.splice(i, 1);
            i--;
        } else if (segs[i] === '..') {
            if (i === 0) {
                segs.splice(i, 1);
                i--;
            } else {
                segs.splice(i - 1, 2);
                i -= 2;
            }
        }
    }
    if (segs.length === 0 || (segs.length === 1 && segs[0] === '')) {
        resolvedPath = '/';
    } else {
        resolvedPath = segs.join('/');
        if (startRoot && !resolvedPath.startsWith('/')) {
            resolvedPath = '/' + resolvedPath;
        }
    }

    // 去除尾随斜杠
    if (resolvedPath !== '/' && resolvedPath.endsWith('/')) {
        resolvedPath = resolvedPath.slice(0, -1);
    }

    // 在 Windows 上，路径会以 `/` 开头，需要去掉
    if (option.isWin32 && resolvedPath.startsWith('/')) {
        resolvedPath = resolvedPath.slice(1);
    }

    return resolvedPath;
}
