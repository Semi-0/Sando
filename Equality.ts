import { get_base_value } from "./Basic/Layer"
import { layers_every, layers_length, get_annotation_layers, is_layered_object, type LayeredObject } from "./Basic/LayeredObject"
import { type Layer } from "./Basic/Layer"
import { set_get_length, set_some, set_every, set_has, set_reduce, is_better_set } from "generic-handler/built_in_generics/generic_better_set"
import { is_equal } from "generic-handler/built_in_generics/generic_arithmetic"
import { generic_wrapper } from "generic-handler/built_in_generics/generic_wrapper"
import { define_generic_procedure_handler } from "generic-handler/GenericProcedure"
import { all_match } from "generic-handler/Predicates"

export function layers_base_equal<T>(value1: any | LayeredObject<T>, value2: any | LayeredObject<T>): boolean{
    return is_equal(get_base_value(value1), get_base_value(value2))
}

export const layers_length_equal = generic_wrapper(is_equal, (a: any) => a, layers_length, layers_length)

export const all_layers_equal = (a: LayeredObject<any>, b: LayeredObject<any>) => layers_every(a, b.has_layer) && layers_every(b, a.has_layer)

export const all_layers_value_equal = (a: LayeredObject<any>, b: LayeredObject<any>) => set_reduce(get_annotation_layers(a), 
                                                                                                   (acc: boolean, l: Layer<any>) => acc && is_equal(l.get_value(a), l.get_value(b)), 
                                                                                                   true) 


export const layered_deep_equal = (a: LayeredObject<any>, b: LayeredObject<any>): boolean => (is_layered_object(a) && is_layered_object(b)) &&
                                                                                              layers_base_equal(a, b) && 
                                                                                              layers_length_equal(a, b) &&
                                                                                              all_layers_value_equal(a, b)


define_generic_procedure_handler(is_equal, all_match(is_better_set), (a: any, b: any) => {
    return set_every(a, (value: any) => set_some(b, (value2: any) => is_equal(value, value2)))
})

define_generic_procedure_handler(is_equal, all_match(is_layered_object), layered_deep_equal)