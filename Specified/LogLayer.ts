// logging the info

import { construct_simple_generic_procedure, define_generic_procedure_handler, error_generic_procedure_handler } from "generic-handler/GenericProcedure";
import { layer_accessor, make_annotation_layer, type Layer } from "../Basic/Layer";
import { construct_layer_ui, type LayeredObject } from "../Basic/LayeredObject";
import { default_merge_procedure } from "../Basic/LayerGenerics";
import { all_match, match_args, register_predicate } from "generic-handler/Predicates";
import { is_array } from "generic-handler/built_in_generics/generic_predicates";
import { timestamp_to_ordinary_time } from "../utility";

export interface LogEntry {
    identifier: string
    get_value(): string
    get_message(): string
    get_timestamp(): number
    describe_self(): string
    to_console(): void
    merge(other: LogEntry): LogEntry[]
}

export function make_log_entry(base_value: any, message: string): LogEntry {
    const timestamp = Date.now();
    const describe_self = () => `${message}, at: ${timestamp_to_ordinary_time(timestamp)}, value: ${base_value}`;
    const log_entry: LogEntry = {
        identifier: "log_entry",
        get_value: () => base_value,
        get_message: () => message,
        get_timestamp: () => timestamp,
        describe_self,
        to_console: () => console.log(describe_self()),
        merge: (other: LogEntry) => [log_entry, other]
    }
    return log_entry;
}

export const is_log_entry = register_predicate("is_log_entry", (a: any): a is LogEntry => {
    return a.identifier === "log_entry"
})

export const is_log_entry_list = register_predicate("is_log_entry_list", (a: any): a is LogEntry[] => {
    return is_array(a) && a.every(is_log_entry)
})

export const merge_log_entry = construct_simple_generic_procedure("merge_log_entry", 2, error_generic_procedure_handler("merge_log_entry"))

define_generic_procedure_handler(merge_log_entry, all_match(is_log_entry), (a: LogEntry, b: LogEntry) => {
    return a.merge(b)
})

define_generic_procedure_handler(merge_log_entry, match_args(is_log_entry_list, is_log_entry), (a: LogEntry[], b: LogEntry) => {
    return [...a, b]
})

define_generic_procedure_handler(merge_log_entry, match_args(is_log_entry_list, is_log_entry_list), (a: LogEntry[], b: LogEntry[]) => {
    return [...a, ...b]
})

export const log_layer = make_annotation_layer("log", (get_name: () => string, 
                                                       has_value: (object: any) => boolean,
                                                       get_value: (object: any) => any,
                                                       is_equal: (a: LayeredObject<any>, b: LayeredObject<any>) => boolean): Layer<any> => {  
    function get_default_value(): any {
        return []
    }

    function get_procedure(name: string, arity: number): any | undefined {
       return default_merge_procedure(merge_log_entry, [])
    }

    function summarize_self(): string[] {
        return ["log"]
    }

    function summarize_value(object: LayeredObject<any>): string[]{
        return get_value(object).map((a: LogEntry) => a.describe_self())
    }

    return {
        identifier: "layer",
        get_name,
        has_value,
        get_value,
        get_default_value,
        get_procedure,
        summarize_self,
        summarize_value,
        is_equal
    }
})

export function has_log_layer(a: LayeredObject<any>): boolean {
    return log_layer.has_value(a)
}    

export const get_log_layer_value = layer_accessor(log_layer)

export function construct_log_value(base_value: any, message: string): LogEntry[] {
    return [make_log_entry(base_value, message)]
}

export const add_log = construct_layer_ui(
    log_layer,
    construct_log_value,
    (new_value: any, old_values: any) => {
        return merge_log_entry(old_values, new_value)
    }
)