import { register_predicate } from "generic-handler/Predicates"
import { is_bundled_obj } from "./Bundle"
import { andExecute } from "generic-handler/built_in_generics/generic_combinator"
import { is_layered_object, type LayeredObject } from "./LayeredObject"

export interface Layer{
    identifier: string
    get_name(): string
    has_value(object: LayeredObject): boolean
    get_value(object: LayeredObject): any
    get_default_value(): any 
    summarize_self(): string[]
    get_procedure(name: string, arity: number): any | undefined
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

export function make_annotation_layer(name: string, 
                                      constructor: (get_name: () => string, 
                                                    has_value: (object: any) => boolean,
                                                    get_value: (object: any) => any) => Layer): Layer{                          

    function get_name(): string{
        return name
    }

    function has_value(object: any ): boolean{
        return is_layered_object(object) ? object.has_layer(name) : false
    } 

    function get_value(object: any): any{
        return has_value(object) ? object.get_layer_value(name) : layer.get_default_value()
    }

    const layer = constructor(get_name, has_value, get_value)

    return layer
}


export function layer_accessor(layer: Layer){
    return (object: LayeredObject) => {
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