import { construct_simple_generic_procedure, define_generic_procedure_handler, error_generic_procedure_handler } from "generic-handler/GenericProcedure";
import { layer_accessor, make_annotation_layer, type Layer } from "../Basic/Layer";
import { construct_layer_ui, type LayeredObject } from "../Basic/LayeredObject";
import { default_merge_procedure } from "../Basic/LayerGenerics";
import { all_match, register_predicate } from "generic-handler/Predicates";
import { timestamp_to_ordinary_time } from "../utility";

export interface TimeStampedValue {
    value: any;
    timestamp: number;
}

export function describe_timestamped_value(a: TimeStampedValue): string {
    return "value:" + a.value + ", timestamp:" +  timestamp_to_ordinary_time(a.timestamp)
}

export function make_timestamped_value(value: any, timestamp: number = Date.now()): TimeStampedValue {
    return { value, timestamp };
}

export const is_timestamped_value = register_predicate("is_timestamped_value", (a: any): a is TimeStampedValue => {
    return typeof a === "object" && "value" in a && "timestamp" in a && typeof a.timestamp === "number";
});

export const merge_timestamped_value = construct_simple_generic_procedure("merge_timestamped_value", 2, error_generic_procedure_handler("merge_timestamped_value"));

define_generic_procedure_handler(merge_timestamped_value, all_match(is_timestamped_value), (a: TimeStampedValue, b: TimeStampedValue) => {
    return {
        value: b.value,
        timestamp: Math.max(a.timestamp, b.timestamp)
    };
});

export const time_layer = make_annotation_layer("time", (get_name: () => string, 
                                                         has_value: (object: any) => boolean,
                                                         get_value: (object: any) => any): Layer => {  
    function get_default_value(): TimeStampedValue {
        return { value: undefined, timestamp: 0 };
    }

    function get_procedure(name: string, arity: number): any | undefined {
        return default_merge_procedure(merge_timestamped_value, get_default_value());
    }

    function summarize_self(): string[] {
        return ["time"];
    }

    function summarize_value(object: LayeredObject): string[]{
        return [get_value(object)]
    }
    return {
        identifier: "layer",
        get_name,
        has_value,
        get_value,
        get_default_value,
        get_procedure,
        summarize_self,
        summarize_value
    };
});

export function has_time_layer(a: LayeredObject): boolean {
    return time_layer.has_value(a);
}    

export const get_time_layer_value = layer_accessor(time_layer);

export function construct_time_value(base_value: any, timestamp?: number): TimeStampedValue {
    return make_timestamped_value(base_value, timestamp);
}

export const annotate_time = construct_layer_ui(
    time_layer,
    construct_time_value,
    (new_value: TimeStampedValue, old_value: TimeStampedValue) => {
        return merge_timestamped_value(new_value, old_value);
    }
);

export const annotate_now = (base_value: any) => annotate_time(base_value, Date.now());