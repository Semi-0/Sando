import { register_predicate } from "generic-handler/Predicates";

import { base_layer, get_base_value, get_layer_name, is_base_layer, is_layer, type Layer } from "./Layer";
import type { BetterSet } from "generic-handler/built_in_generics/generic_better_set";
import { construct_better_set, map_to_same_set, get_length, has, find, filter, flat_map, to_array, add_item, is_better_set, get, map_to_new_set } from "generic-handler/built_in_generics/generic_better_set";
import { guard, throw_error } from "generic-handler/built_in_generics/other_generic_helper";
import { pipe } from "fp-ts/lib/function";
import { is_bundled_obj } from "./Bundle";
import { is_array, is_null } from "generic-handler/built_in_generics/generic_predicates";
import { map_to_array } from "../utility";
import { to_string } from "generic-handler/built_in_generics/generic_conversation";

export interface LayeredObject<T> {
    identifier: string;
    alist: BetterSet<Layer<any>>;
    has_layer(layer: Layer<any>): boolean;
    get_layer_value(layer: Layer<any>): any | undefined;
    update_layer(layer: Layer<any>, value: any): LayeredObject<T>;
    annotation_layers(): BetterSet<Layer<any>>;
    summarize_self(): string[]; 
    describe_self(): string;
}

export const is_pair = register_predicate("is_pair", (a: any): a is [any, any] => {
    return is_array(a) && a.length === 2
})

export const every = register_predicate("every", (predicate: (a: any) => boolean, set: BetterSet<any>): boolean => {
    return get_length(filter(set, predicate)) === get_length(set)
})

export function get_alist_pair_name(pair: [Layer<any>, any]): string{
    guard(is_proper_pair(pair), throw_error("make_layered_alist", "Item is not a proper pair", typeof pair))
    return pair[0].get_name()
}

export function make_layered_alist(plist: [Layer<any>, any][]): BetterSet<any>{
    return construct_better_set(plist, get_alist_pair_name)
}

export const is_proper_pair = register_predicate("is_proper_pair", (a: any): a is [Layer<any>, any] => {
    return is_pair(a) && is_layer(a[0])
})

export function is_layered_alist(alist: BetterSet<[Layer<any>, any]>): boolean{
    return is_better_set(alist) && every(is_proper_pair, alist)
}

export function make_template(layer: Layer<any>): [Layer<any>, any]{
    return [layer, undefined]
}

export function assv(template_layer: Layer<any>, alist: BetterSet<[Layer<any>, any]>): any{
    const item = get(alist, make_template(template_layer))
    guard(is_pair(item), throw_error("assv", "Item is not a pair", ""))
    return item
}

export function layered_object<T>(base_layer: any, ...plist: [Layer<any>, any][]): LayeredObject<T>{
    return construct_layered_object(base_layer, make_layered_alist(plist))
}


export function construct_layered_object<T>(base_value: T, _alist: BetterSet<any> ): LayeredObject<T> {

    guard(is_layered_alist(_alist), throw_error("construct_layered_object", "Alist is not a layered alist", typeof _alist))

    const alist = add_item(_alist, [base_layer(), base_value])

 
    function has_layer(layer: Layer<any>): boolean {
        return has(alist, make_template(layer));
    }

    function get_layer_value(layer: Layer<any>): any | undefined {
        return assv(layer, alist)?.[1]
    }

    function update_layer(layer: Layer<any>, value: any): LayeredObject<T>{
        guard(!has_layer(layer), () => console.log("update_layer: layer already exists, layer: " + summarize_self()))

        return construct_layered_object(base_value, add_item(alist, [layer, value]))
    }
    


    function annotation_layers(): BetterSet<Layer<any>> {
        // remove the last element because it is the base layer
        // TODO!!!: if the original map is fixed the
        // const result = map_to_new_set(alist, (v: [Layer, any]) => {return v[0]}, get_layer_name)

        return pipe(alist, 
            (s: BetterSet<[Layer<any>, any]>) => map_to_new_set(s, (v: [Layer<any>, any]) => {return v[0]}, get_layer_name),
            (s: BetterSet<Layer<any>>) => filter(s, (layer: Layer<any>) => !is_base_layer(layer))
        )
    }

    function summarize_self(): string[]{
        return [to_string(base_value)]
    } 

    function describe_self(): string{
        const base_layer_description = get_layer_value(base_layer())
        //@ts-ignore
   
        return [base_layer_description, ...map_to_array(annotation_layers(), (layer: Layer) => {
            return layer.get_name() + " layer: " + layer.summarize_value(self)
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

export const is_layered_object = register_predicate("is_layered_object", (a: any): a is LayeredObject<any> => {
    return is_bundled_obj("layered_object")(a)
})

export function get_annotation_layers(obj: any | LayeredObject<any>): BetterSet<Layer<any>>{
    if (is_layered_object(obj)){
        return obj.annotation_layers()
    }
    else{
        //@ts-ignore
        return construct_better_set([], get_layer_name)
    }
}

export function construct_layer_ui<T>(layer: Layer<T>, value_constructor: (base_value: any, ...values: any[]) => any, merge: (new_value: any, old_values: any) => any): (maybeObj: LayeredObject<any> | any, ...updates: any[]) => LayeredObject<any>{ 
    return (maybeObj: LayeredObject<any> | any, ...updates: any[]): LayeredObject<any> => {
      
        if (is_layered_object(maybeObj)){
            const layered_object : LayeredObject<T> = maybeObj
            const constructed_update = value_constructor(get_base_value(layered_object), ...updates)
            if (layer.has_value(layered_object)){
                return layered_object.update_layer(layer, merge(constructed_update, layered_object.get_layer_value(layer)))
            } else {
                return layered_object.update_layer(layer, constructed_update)
            }
        }
        else{
            const base : any = maybeObj
            const constructed_update = value_constructor(base, ...updates)
            return layered_object(base, [layer, constructed_update])
        }   
    }
}


