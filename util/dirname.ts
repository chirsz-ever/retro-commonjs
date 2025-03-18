export function dirname(path: string): string {
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