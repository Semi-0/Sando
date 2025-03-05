import { construct_simple_generic_procedure, define_generic_procedure_handler, error_generic_procedure_handler } from "generic-handler/GenericProcedure";
import { layer_accessor, make_annotation_layer, type Layer } from "../Basic/Layer";
import { construct_layer_ui, type LayeredObject } from "../Basic/LayeredObject";
import { default_merge_procedure } from "../Basic/LayerGenerics";
import { all_match, match_args, register_predicate } from "generic-handler/Predicates";
import { is_array } from "generic-handler/built_in_generics/generic_predicates";
import { define_layered_procedure_handler } from "../Basic/LayeredProcedure";


export interface ErrorPair{
    identifier: string
    get_error(): string
    get_value(): any
    merge(other: ErrorPair): ErrorPair[]
    summarize_value(): string
}

export function make_error_pair(error: string, value: any): ErrorPair{
    const error_pair: ErrorPair = {
        identifier: "error_pair",
        get_error,
        get_value,
        merge,
        summarize_value
    }
    function get_error(): string{
        return error
    }

    function get_value(): any{
        return value
    }

    function merge(other: ErrorPair): ErrorPair[]{
        return [error_pair, other]
    }

    function summarize_value(): string{
        return  error + ", value:" + value
    }

    return error_pair
}



export const is_error_pair = register_predicate("is_error_pair", (a: any): a is ErrorPair => {
    return a.identifier === "error_pair"
})



export const is_error_pair_list = register_predicate("is_error_pair_list", (a: any): a is ErrorPair[] => {
    return is_array(a) && a.every(is_error_pair)
})

export const merge_error_pair = construct_simple_generic_procedure("is_error_pair", 2, error_generic_procedure_handler("merge_error_pair"))

define_generic_procedure_handler(merge_error_pair, all_match(is_error_pair), (a: ErrorPair, b: ErrorPair) => {
    return a.merge(b)
})

define_generic_procedure_handler(merge_error_pair, match_args(is_error_pair_list, is_error_pair), (a: ErrorPair[], b: ErrorPair) => {
    return [...a, b]
})

define_generic_procedure_handler(merge_error_pair, match_args(is_error_pair_list, is_error_pair_list), (a: ErrorPair[], b: ErrorPair[]) => {
    return [...a, ...b]
})


export const error_layer = make_annotation_layer("error", (get_name: () => string, 
                                                           has_value: (object: any) => boolean,
                                                           get_value: (object: any) => any,
                                                           is_equal: (a: LayeredObject<any>, b: LayeredObject<any>) => boolean): Layer<any> => {  
    function get_default_value(): any{
        return []
    }

    function get_procedure(name: string, arity: number): any | undefined{
       return default_merge_procedure(
        merge_error_pair, [])
    }

    function summarize_self(): string[]{
        return ["error"]
    }

    function describe(object: LayeredObject<any>): string[]{
        return get_value(object)
    }

    function summarize_value(object: LayeredObject<any>): string[]{
        return [get_value(object).map((a: ErrorPair) => a.summarize_value()).join("\n")]
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

export function has_error_layer(a: LayeredObject<any>): boolean {
    return error_layer.has_value(a)
}    

export const get_error_layer_value = layer_accessor(error_layer)

export function construct_error_value(base_value: any, error: string): ErrorPair[]{
    return [make_error_pair(error, base_value)]
}

export const mark_error = construct_layer_ui(
    error_layer,
    construct_error_value,
    (new_value: any, old_values: any) => {
        return merge_error_pair(new_value, old_values)
    }
)

