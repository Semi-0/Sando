import { register_predicate } from "generic-handler/Predicates"
import { is_bundled_obj } from "./Bundle"
import { andExecute } from "generic-handler/built_in_generics/generic_combinator"
import { is_layered_object, type LayeredObject } from "./LayeredObject"
import { guard, throw_error } from "generic-handler/built_in_generics/other_generic_helper"
import { is_string } from "generic-handler/built_in_generics/generic_predicates"
import { deep_equal } from "../Equality"
import { to_string } from "generic-handler/built_in_generics/generic_conversation"

export interface Layer<T>{
    identifier: string
    get_name(): string
    has_value(object: LayeredObject<any>): boolean
    get_value(object: LayeredObject<any>): any
    get_default_value(): any 
    summarize_self(): string[]
    get_procedure(name: string, arity: number): any | undefined,
    summarize_value(object: LayeredObject<any>): string[]
    is_equal(a: any | LayeredObject<any>, b: any | LayeredObject<any>): boolean

}


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

    function summarize_value(object: LayeredObject<any>): string[]{
        return [to_string(get_value(object))]
    }



    return {
        identifier: "layer",
        get_name,
        has_value,
        get_value,
        summarize_self,
        get_default_value,
        get_procedure,
        summarize_value,
        is_equal: (a: any, b: any) => get_base_value(a) === get_base_value(b)
    }
}

export function is_base_layer<T>(layer: Layer<T>): boolean{
    return layer.get_name() === "base"
}

export function make_annotation_layer<T, A>(name: string, 
                                      constructor: (get_name: () => string, 
                                                    has_value: (object: LayeredObject<A>) => boolean,
                                                    get_value: (object: LayeredObject<A>) => A,
                                                    is_equal: (a: LayeredObject<A>, b: LayeredObject<A>) => boolean) => Layer<A>): Layer<T>{                          
 
    function get_name(): string{
        return name
    }

    function has_value(object: LayeredObject<A>): boolean{
        return is_layered_object(object) ? object.has_layer(layer) : false
    } 

    function get_value(object: LayeredObject<A>): A{
        return has_value(object) ? object.get_layer_value(layer) : layer.get_default_value()
    }

    function is_equal(a:  LayeredObject<A>, b: LayeredObject<A>): boolean{
        return deep_equal(get_value(a), get_value(b))
    }

    const layer = constructor(get_name, has_value, get_value, is_equal)

    return layer
}


export function layer_accessor<T>(layer: Layer<T>){
    return (object: LayeredObject<T>) => {
        return layer.get_value(object)
    }
}

export const get_base_value = layer_accessor(base_layer())

export const is_layer = register_predicate("is_layer", (value: any): value is Layer<any> => {
    return is_bundled_obj("layer")(value)
})

// export function is_layer(value: any): value is Layer{
//     return value instanceof Layer
// }