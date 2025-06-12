import {  type BetterSet, construct_better_set, set_merge } from "generic-handler/built_in_generics/generic_better_set"
import { layer_accessor, make_annotation_layer, type Layer } from "../Basic/Layer"
import { default_merge_procedure } from "../Basic/LayerGenerics"
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import {  type LayeredObject } from "../Basic/LayeredObject"
import { map_to_array } from "../utility"
import { construct_layered_datum } from "../Basic/LayeredDatum"
export const support_layer = make_annotation_layer("support", (get_name: () => string, 
                                                              has_value: (object: any) => boolean,
                                                              get_value: (object: any) => any,
                                                              summarize_self: () => string[]): Layer<any> => {

    function get_default_value(): any{
        return construct_better_set([])
    } 

    function get_procedure(name: string, arity: number): any | undefined{
        return default_merge_procedure(set_merge, empry_support_set())
    }
  
    return {
        get_name,
        has_value,
        get_value,
        get_default_value,
        get_procedure,
        summarize_self,
    }
})

export const construct_defualt_support_set = (l: any[]) => construct_better_set(l)

export const empry_support_set = () => construct_defualt_support_set([])

export const default_support_procedure = (a: BetterSet<string> | string, b: BetterSet<string> | string) => {
    return default_merge_procedure(set_merge, empry_support_set)
}

export function has_support_layer(a: LayeredObject<any>): boolean{
    return  support_layer.has_value(a)
}

export const get_support_layer_value = layer_accessor(support_layer)



export const support_by = (v: any, s: string) => construct_layered_datum(v, 
    support_layer,  construct_defualt_support_set([s])) 




// const a = 1
// const b = support_by(a, "test") 
// const c = support_by(b, "test2")

// console.log(get_support_layer_value(c))
