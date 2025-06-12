export function timestamp_to_ordinary_time(timestamp: number): string {
    const date = new Date(timestamp);
    const microseconds = (timestamp % 1000).toString().padStart(6, '0');
    return `${date.toISOString().slice(0, -1)}${microseconds.slice(3)}`;
}
import { compose } from "generic-handler/built_in_generics/generic_combinator"
import { map } from "generic-handler/built_in_generics/generic_collection";
import { to_array } from "generic-handler/built_in_generics/generic_collection";
import { trace_function } from "generic-handler/built_in_generics/generic_debugger";

//@ts-ignore
export const map_to_array  = compose(map, to_array)

export const log_tracer = trace_function(console.log)