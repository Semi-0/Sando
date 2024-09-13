import { register_predicate } from "generic-handler/Predicates"
import { is_bundled_obj } from "./Bundle"
import { andExecute } from "generic-handler/built_in_generics/generic_combinator"
import { is_layered_object, type LayeredObject } from "./LayeredObject"
import { guard, throw_error } from "generic-handler/built_in_generics/other_generic_helper"
import { inspect } from "bun"

export interface Layer{
    identifier: string
    get_name(): string
    has_value(object: LayeredObject): boolean
    get_value(object: LayeredObject): any
    get_default_value(): any 
    summarize_self(): string[]
    get_procedure(name: string, arity: number): any | undefined
}


export function get_layer_name(layer: Layer): string{
    guard(is_layer(layer), throw_error("get_layer_name", "type mismatch, expect layer, but got: ", inspect(layer, {depth: 100})))
    return layer.get_name()
}

export function base_layer(): Layer{

    function get_name(): string{
        return "base"
    }

    function has_value(object: LayeredObject): boolean{
        return true
    }

    function get_value(object: LayeredObject): any{
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
        identifier: "layer",
        get_name,
        has_value,
        get_value,
        summarize_self,
        get_default_value,
        get_procedure
    }
}

export function is_base_layer(layer: Layer): boolean{
    return layer.get_name() === "base"
}

export function make_annotation_layer(name: string, 
                                      constructor: (get_name: () => string, 
                                                    has_value: (object: any) => boolean,
                                                    get_value: (object: any) => any) => Layer): Layer{                          

    function get_name(): string{
        return name
    }

    function has_value(object: LayeredObject ): boolean{
        return is_layered_object(object) ? object.has_layer(layer) : false
    } 

    function get_value(object: LayeredObject): any{
        return has_value(object) ? object.get_layer_value(layer) : layer.get_default_value()
    }

    const layer = constructor(get_name, has_value, get_value)

    return layer
}


export function layer_accessor(layer: Layer){
    return (object: LayeredObject) => {
        console.log("layer_accessor: layer: " + layer.get_name())
        console.log("layer_accessor: object: " + object.describe_self())
        return layer.get_value(object)
    }
}

export const get_base_value = layer_accessor(base_layer())

export const is_layer = register_predicate("is_layer", (value: any): value is Layer => {
    return is_bundled_obj("layer")(value)
})

// export function is_layer(value: any): value is Layer{
//     return value instanceof Layer
// }