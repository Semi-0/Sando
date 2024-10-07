export function timestamp_to_ordinary_time(timestamp: number): string {
    const date = new Date(timestamp);
    const microseconds = (timestamp % 1000).toString().padStart(6, '0');
    return `${date.toISOString().slice(0, -1)}${microseconds.slice(3)}`;
}
import { compose } from "generic-handler/built_in_generics/generic_combinator"
import { map_to_same_set } from "generic-handler/built_in_generics/generic_better_set";
import { to_array } from "generic-handler/built_in_generics/generic_better_set";

//@ts-ignore
export const map_to_array  = compose(map_to_same_set, to_array)