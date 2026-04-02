export function withMode(path, mode) {
    return mode ? `${path}?mode=${mode}` : path;
}

export function formatLastActive(ts) {
    if (!ts) return "Never";

    const diff = Date.now() - new Date(ts).getTime();

    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (mins === 0) return "Just now";
    if (mins > 0 && mins < 5) return "Recently";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function formatMovement(val) {
    if (val < 1) return val.toFixed(2);   // small → more precision
    return val.toFixed(1);               // normal → 1 decimal
}

export function getRecoveryType(score) {
    if (score >= 70) return "positive";
    if (score <= 40) return "negative";
    return "neutral";
}

export function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "—";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins} min`;

    return `${mins} min ${secs}s`;
}