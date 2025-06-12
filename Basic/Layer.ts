import { all_match, match_args, register_predicate } from "generic-handler/Predicates"
import { is_bundled_obj } from "./Bundle"
import { andExecute } from "generic-handler/built_in_generics/generic_combinator"
import { is_layered_object, type LayeredObject } from "./LayeredObject"
import { guard, throw_error } from "generic-handler/built_in_generics/other_generic_helper"
import { is_string } from "generic-handler/built_in_generics/generic_predicates"

import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import { construct_better_set, identify_by, set_merge, type BetterSet } from "generic-handler/built_in_generics/generic_better_set"
import { define_generic_procedure_handler } from "generic-handler/GenericProcedure"
import { is_equal } from "generic-handler/built_in_generics/generic_arithmetic"

export interface Layer<T>{
    get_name(): string
    has_value(object: LayeredObject<any>): boolean
    get_value(object: LayeredObject<any>): any
    get_default_value(): any 
    summarize_self(): string[]
    get_procedure(name: string, arity: number): any ,
}

export const is_layer = register_predicate("is_layer", (value: any): value is Layer<any> => {
    return value != undefined && value != null && 
    value.has_value != undefined && 
    value.get_value != undefined &&
    value.summarize_self != undefined &&
    value.get_procedure != undefined
})


export function get_layer_name(layer: Layer<any> | string): string{
    // console.log("get_layer_name", layer)
    guard( is_layer(layer) || is_string(layer), throw_error("get_layer_name", "type mismatch, expect layer or string, but got: ", typeof layer))
    //@ts-ignore
    return is_string(layer) ? layer : layer.get_name()
}

export function base_layer<T>(): Layer<T>{

    function get_name(): string{
        return "base"
    }

    function has_value(object: LayeredObject<T>): boolean{
        return true
    }

    function get_value(object: LayeredObject<T>): T{
        return is_layered_object(object) ? object.get_layer_value(base_layer()) : object
    }

    function summarize_self(): [string]{
        return [get_name()]
    } 

    function get_default_value(): any{
        return undefined
    } 

    function get_procedure(name: string, arity: number): any | undefined{
        throw new Error("base_layer: get_procedure not implemented")
    }

    return {
        get_name,
        has_value,
        get_value,
        summarize_self,
        get_default_value,
        get_procedure,
    }
}

export function is_base_layer<T>(layer: Layer<T>): boolean{
    return layer.get_name() === "base"
}

export function make_annotation_layer<T, A>(name: string, 
                                      constructor: (get_name: () => string, 
                                                    has_value: (object: LayeredObject<A>) => boolean,
                                                    get_value: (object: LayeredObject<A>) => A,
                                                    summarize_self: () => string[]) => Layer<A>): Layer<T>{                          
 
    function get_name(): string{
        return name
    }

    function has_value(object: LayeredObject<A>): boolean{
        return is_layered_object(object) ? object.has_layer(layer) : false
    } 

    function get_value(object: LayeredObject<A>): A{
        return has_value(object) ? object.get_layer_value(layer) : layer.get_default_value()
    }

    function summarize_self(): string[]{
        return [get_name()]
    }

    const layer = constructor(get_name, has_value, get_value, summarize_self)

    return layer
}

export function make_unprocedural_layer<T>(name: string, get_default_value: () => T): Layer<T>{
    return make_annotation_layer(name, (get_name, has_value, get_value, summarize_self) => {
        return {
            get_name,
            has_value,
            get_value, 
            get_default_value,
            summarize_self,
            get_procedure: () => undefined
        }
    })
}

define_generic_procedure_handler(identify_by, match_args(is_layer), get_layer_name)


define_generic_procedure_handler(is_equal, all_match(is_layer), (a: Layer<any>, b: Layer<any>) => {
    return a.get_name() === b.get_name()
})

export const construct_layers_set = (...layers: Layer<any>[]) => construct_better_set(layers)

export const construct_empty_layers_set = () => construct_layers_set()

export const layers_set_merge = (a: BetterSet<Layer<any>>, b: BetterSet<Layer<any>>) => set_merge(a, b)


export function layer_accessor<T>(layer: Layer<T>){
    return (object: LayeredObject<T>) => {
        return layer.get_value(object)
    }
}

export const get_base_value = layer_accessor(base_layer())



// export function is_layer(value: any): value is Layer{
//     return value instanceof Layer
// }