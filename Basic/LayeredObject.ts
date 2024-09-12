import { register_predicate } from "generic-handler/Predicates";

import { base_layer, is_layer, type Layer } from "./Layer";
import type { BetterSet } from "generic-handler/built_in_generics/generic_better_set";
import { construct_better_set, map, get_length, has, find, filter, flat_map, to_array, add_item, is_better_set, get } from "generic-handler/built_in_generics/generic_better_set";
import { guard, throw_error } from "generic-handler/built_in_generics/other_generic_helper";
import { pipe } from "fp-ts/lib/function";
import { is_bundled_obj } from "./Bundle";
import { is_array, is_null } from "generic-handler/built_in_generics/generic_predicates";
import { leftReader } from "fp-ts/lib/StateReaderTaskEither";
import { inspect } from "bun";

export interface LayeredObject {
    identifier: string;
    alist: BetterSet<Layer>;
    has_layer(layer: Layer): boolean;
    get_layer_value(layer: Layer): any | undefined;
    update_layer(layer: Layer, value: any): LayeredObject;
    annotation_layers(): Layer[];
    summarize_self(): string[]; 
    describe_self(): string[];
}

export const is_pair = register_predicate("is_pair", (a: any): a is [any, any] => {
    return is_array(a) && a.length === 2
})

export const every = register_predicate("every", (predicate: (a: any) => boolean, set: BetterSet<any>): boolean => {
    return get_length(filter(set, predicate)) === get_length(set)
})

export function make_layered_alist(plist: [Layer, any][]): BetterSet<any>{
    console.log("plist: " + inspect(plist, {depth: 100}))
    return construct_better_set(plist, (a: [Layer, any]) => {
        console.log("length: " + a.length)
        guard(is_proper_pair(a), throw_error("make_layered_alist", "Item is not a proper pair", inspect(a, {depth: 100})))
        
        return a[0].get_name()
    })
}

export const is_proper_pair = register_predicate("is_proper_pair", (a: any): a is [Layer, any] => {
    console.log("is_pair: " + is_pair(a))
    console.log("is_layer: " + is_layer(a[0]))
    return is_pair(a) && is_layer(a[0])
})

export function is_layered_alist(alist: BetterSet<[Layer, any]>): boolean{
    return is_better_set(alist) && every(is_proper_pair, alist)
}

export function make_template(layer: Layer): [Layer, any]{
    return [layer, undefined]
}

export function assv(template_layer: Layer, alist: BetterSet<[Layer, any]>): any{
    const item = get(alist, make_template(template_layer))
    guard(is_pair(item), throw_error("assv", "Item is not a pair", ""))
    return item
}

export function layered_object(base_layer: any, ...plist: [Layer, any][]): LayeredObject{
    return construct_layered_object(base_layer, make_layered_alist(plist))
}


export function construct_layered_object(base_value: any, _alist: BetterSet<any> ): LayeredObject {

    guard(is_layered_alist(_alist), throw_error("construct_layered_object", "Alist is not a layered alist", inspect(_alist, {depth: 100})))
    guard(get_length(_alist) > 0, throw_error("construct_layered_object", "Alist is empty", ""))

    const alist = add_item(_alist, [base_layer(), base_value])

 
    function has_layer(layer: Layer): boolean {
        return has(alist, make_template(layer));
    }

    function get_layer_value(layer: Layer): any | undefined {
        return assv(layer, alist)?.[1]
    }

    function update_layer(layer: Layer, value: any): LayeredObject{
        guard(!has_layer(layer), () => console.log("update_layer: layer already exists, layer: " + summarize_self()))

        return construct_layered_object(value, add_item(alist, [layer, value]))
    }


    function annotation_layers(): Layer[] {
        // remove the last element because it is the base layer
        return map(alist, (v: [Layer, any]) => v[0]).splice(0, get_length(alist) - 1)
    }

    function summarize_self(): string[]{
        return [base_value]
    } 

    function describe_self(): string[]{
        return map(alist, (v: [Layer, any]) => v[0].get_name() + " layer: " + v[1])
    }

    return {
        identifier: "layered_object",
        alist,
        has_layer,
        update_layer,
        get_layer_value,
        annotation_layers,
        summarize_self,
        describe_self
    }
}

export const is_layered_object = register_predicate("is_layered_object", (a: any): a is LayeredObject => {
    return is_bundled_obj("layered_object")(a)
})


export function construct_layer_ui(layer: Layer, value_constructor: (value: any) => any, merge: (new_value: any, old_values: any) => any): any{ 
    return (maybeObj: any, update: any): any => {
        const constructed_update = value_constructor(update)
        if (is_layered_object(maybeObj)){
            const layered_object = maybeObj
            if (layer.has_value(layered_object)){
                return layered_object.update_layer(layer, merge(constructed_update, layered_object.get_layer_value(layer)))
            } else {
                return layered_object.update_layer(layer, constructed_update)
            }
        }
        else{
            const base = maybeObj
            return layered_object(base, [layer, constructed_update])
        }   
    }
}


