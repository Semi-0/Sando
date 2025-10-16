import { match_args, register_predicate } from "generic-handler/Predicates";

import { base_layer, construct_empty_layers_set, get_base_value, get_layer_name, is_base_layer, is_layer, type Layer } from "./Layer";
import type { BetterSet } from "generic-handler/built_in_generics/generic_better_set";
import { construct_better_set, is_better_set, identify_by } from "generic-handler/built_in_generics/generic_better_set";

import { guard, throw_error } from "generic-handler/built_in_generics/other_generic_helper";
import { pipe } from "fp-ts/lib/function";
import { is_bundled_obj } from "./Bundle";
import { is_array, is_null } from "generic-handler/built_in_generics/generic_predicates";
import { map_to_array } from "../utility";
import { to_string } from "generic-handler/built_in_generics/generic_conversation";
import { compose } from "generic-handler/built_in_generics/generic_combinator";
import { generic_wrapper } from "generic-handler/built_in_generics/generic_wrapper";
import { add_item, filter, find, first, has, length, map, every } from "generic-handler/built_in_generics/generic_collection";
import { define_generic_procedure_handler } from "generic-handler/GenericProcedure";
import { is_equal } from "generic-handler/built_in_generics/generic_arithmetic";



export interface LayeredObject<T> {
    alist: BetterSet<[Layer<any>, any]>;
    has_layer(layer: Layer<any>): boolean;
    get_layer_value(layer: Layer<any>): any | undefined;
    annotation_layers(): BetterSet<Layer<any>>;
    summarize_self(): string[]; 
    describe_self(): string;
}
export const is_layered_object = register_predicate("is_layered_object", (a: any): a is LayeredObject<any> => {
    return a !== undefined && a !== null &&
     a.alist !== undefined && a.alist !== null &&
      a.has_layer !== undefined && a.get_layer_value !== undefined && 
      a.annotation_layers !== undefined && 
      a.summarize_self !== undefined && 
      a.describe_self !== undefined
})
export const is_pair = register_predicate("is_pair", (a: any): a is [any, any] => {
    return is_array(a) && a.length === 2
})

export function get_alist_pair_name(pair: [Layer<any>, any]): string{
    // console.log(is_layer(pair[0]))
    // console.log(pair[1])
    guard(is_proper_pair(pair), throw_error("make_layered_alist", "Item is not a proper pair", typeof pair))
   
    return pair[0].get_name()
}

export const is_proper_pair = register_predicate("is_proper_pair", (a: any): a is [Layer<any>, any] => {
    return is_pair(a) && is_layer(a[0])
})

define_generic_procedure_handler(identify_by, match_args(is_proper_pair), get_alist_pair_name)

export function make_alist(plist: [Layer<any>, any][]): BetterSet<any>{
    return construct_better_set(plist)
}

export function is_alist(alist: BetterSet<[Layer<any>, any]>): boolean{
    return is_better_set(alist) && every(alist, is_proper_pair)
}

export function make_template(layer: Layer<any>): [Layer<any>, any]{
    return [layer, undefined]
}

export function assv(template_layer: Layer<any>, alist: BetterSet<[Layer<any>, any]>): any{
        const item = find(alist, (item: [Layer<any>, any]) => is_equal(item[0], template_layer))
        guard(is_pair(item), throw_error("assv", "Item is not a pair", ""))
        return item
}

export function construct_layered_object<T>(base_value: T, _alist: BetterSet<any> ): LayeredObject<T> {

    guard(is_alist(_alist), throw_error("construct_layered_object", "Alist is not a layered alist", typeof _alist))

    const alist = add_item(_alist, [base_layer(), base_value])

 
    function has_layer(layer: Layer<any>): boolean {
        return has(alist, make_template(layer));
    }

    function get_layer_value(layer: Layer<any>): any  {
        try{
            return assv(layer, alist)[1]
        }
        catch(e){
            throw_error("get_layer_value", "Layer not found", layer.get_name())
        }
    }

    function update_layer(layer: Layer<any>, value: any): LayeredObject<T>{
        guard(!has_layer(layer), () => console.log("update_layer: layer already exists, layer: " + summarize_self()))

        return construct_layered_object(base_value, add_item(alist, [layer, value]))
    }

    function annotation_layers(): BetterSet<Layer<any>> {
        return map(alist, first)
    }

    function summarize_self(): string[]{
        return [to_string(base_value)]
    } 

    function describe_self(): string{
        const base_layer_description = get_layer_value(base_layer())
        //@ts-ignore
   
        return [base_layer_description, ...map_to_array(annotation_layers(), (layer: Layer) => {
            return layer.get_name() + " layer: " + to_string(layer.get_value(self))
        })].join("\n") 
    }

    const self = {
        identifier: "layered_object",
        alist,
        has_layer,
        update_layer,
        get_layer_value,
        annotation_layers,
        summarize_self,
        describe_self 
    }
    return self
}

export const get_annotation_layers = (obj: LayeredObject<any>): BetterSet<Layer<any>> => {
    return is_layered_object(obj) ? obj.annotation_layers() : construct_empty_layers_set()
}



define_generic_procedure_handler(to_string, match_args(is_layered_object), (obj: LayeredObject<any>): string => {
     return (map_to_array(obj.annotation_layers(), (layer: Layer<any>) => {
         return layer.get_name() + " layer: " + to_string(layer.get_value(obj))
     }) as string[]).join("\n") 
})


export const layers_length = compose(get_annotation_layers, length)

export const layers_every = (l: LayeredObject<any>, f: (v: any) => boolean) => every(get_annotation_layers(l), f)

