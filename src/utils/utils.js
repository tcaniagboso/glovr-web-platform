export function withMode(path, mode) {
    return mode ? `${path}?mode=${mode}` : path;
}