export function timestamp_to_ordinary_time(timestamp: number): string {
    const date = new Date(timestamp);
    const microseconds = (timestamp % 1000).toString().padStart(6, '0');
    return `${date.toISOString().slice(0, -1)}${microseconds.slice(3)}`;
}
