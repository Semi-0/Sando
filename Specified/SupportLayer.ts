import {  type BetterSet, construct_better_set,    merge_set } from "generic-handler/built_in_generics/generic_better_set"
import { layer_accessor, make_annotation_layer, type Layer } from "../Basic/Layer"
import { default_merge_procedure } from "../Basic/LayerGenerics"
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import {  construct_layer_ui, type LayeredObject } from "../Basic/LayeredObject"
import { map_to_array } from "../utility"
import { deep_equal } from "../Equality"
export const support_layer = make_annotation_layer("support", (get_name: () => string, 
                                                              has_value: (object: any) => boolean,
                                                              get_value: (object: any) => any,
                                                              is_equal: (a: LayeredObject, b: LayeredObject) => boolean): Layer => {

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
        //@ts-ignore
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
        summarize_value,
        is_equal: (a: LayeredObject, b: LayeredObject) => {
            const support_a = get_value(a)
            const support_b = get_value(b)
            return deep_equal(Array.from(support_a.meta_data.keys()), 
                              Array.from(support_b.meta_data.keys()))
        }
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
        return merge_set(old_values, new_value);
    }
);


// const a = 1
// const b = support_by(a, "test") 
// const c = support_by(b, "test2")

// console.log(get_support_layer_value(c))
