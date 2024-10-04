import {  type BetterSet, construct_better_set,  map_to_array,  merge_set } from "generic-handler/built_in_generics/generic_better_set"
import { layer_accessor, make_annotation_layer, type Layer } from "../Basic/Layer"
import { default_merge_procedure } from "../Basic/LayerGenerics"
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import {  construct_layer_ui, type LayeredObject } from "../Basic/LayeredObject"

export const support_layer = make_annotation_layer("support", (get_name: () => string, 
                                                              has_value: (object: any) => boolean,
                                                              get_value: (object: any) => any): Layer => {

    function get_default_value(): any{
        return construct_better_set([], (a: string) => to_string(a))
    } 

    function get_procedure(name: string, arity: number): any | undefined{
        return default_merge_procedure((a: BetterSet<string>, b: BetterSet<string>) => {
            return merge_set(a, b)
        }, construct_better_set([], (a: string) => to_string(a)))
    }

    function summarize_self(): string[]{
        return ["support"]
    }

    function summarize_value(object: LayeredObject): string[]{
        return map_to_array(get_value(object), (a: string) => to_string(a))
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
    }
})

export function has_support_layer(a: LayeredObject): boolean{
    return  support_layer.has_value(a)
}

export const get_support_layer_value = layer_accessor(support_layer)

export function construct_support_value(base_value: any, ...values: any[]): BetterSet<string>{
    return construct_better_set(values, (a: string) => to_string(a))
}

export const support_by = construct_layer_ui(
    support_layer,
    construct_support_value,
    (new_value: any, old_values: any) => {
        return merge_set(construct_support_value(new_value), old_values);
    }
);