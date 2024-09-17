import { type BetterSet, construct_better_set, merge_set } from "generic-handler/built_in_generics/generic_better_set"
import { layer_accessor, make_annotation_layer, type Layer } from "../Basic/Layer"
import { default_merge_procedure } from "../Basic/LayerGenerics"
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import { construct_layer_ui, type LayeredObject } from "../Basic/LayeredObject"
import { v4 as uuidv4 } from 'uuid';
import { inspect } from "bun"

export const id_layer = make_annotation_layer("id", (get_name: () => string, 
                                                    has_value: (object: any) => boolean,
                                                    get_value: (object: any) => any): Layer => {

    function get_default_value(): any {
        return construct_better_set([], (a: string) => to_string(a))
    }

    function get_procedure(name: string, arity: number): any | undefined {
        return default_merge_procedure((a: BetterSet<string>, b: BetterSet<string>) => {
            return merge_set(a, b)
        }, construct_better_set([], (a: string) => to_string(a)))
    }

    function summarize_self(): string[] {
        return ["id"]
    }

    function summarize_value(object: LayeredObject): string[]{
        return [inspect(get_value(object), {depth: 100})]
    }

    return {
        identifier: "layer",
        get_name,
        has_value,
        get_value,
        get_default_value,
        get_procedure,
        summarize_self,
        summarize_value
    }
})

export function has_id_layer(a: LayeredObject): boolean {
    return id_layer.has_value(a)
}

export const get_id_layer_value = layer_accessor(id_layer)

export function construct_id_value(base_value: any): BetterSet<string> {
    return construct_better_set([uuidv4()], (a: string) => to_string(a))
}

export const mark_id = construct_layer_ui(
    id_layer,
    construct_id_value,
    (new_value: any, old_values: any) => {
        return merge_set(construct_id_value(new_value), old_values);
    }
);


