import { curryArgument, curryArguments } from "generic-handler/built_in_generics/generic_combinator"
import { is_layer, type Layer } from "./Layer"
import type { LayeredObject } from "./LayeredObject"
import { map, reduce } from "generic-handler/built_in_generics/generic_collection"
import { log_tracer } from "generic-handler/built_in_generics/generic_debugger"

export const to_layer_pair = (layer: Layer<any>, object: LayeredObject<any>) => [layer, layer.get_value(object)]
export const to_layer_pair_curried = curryArgument(1, to_layer_pair)
export type LayerPair = [Layer<any>, any]

export const is_layer_pair = (value: any): value is [Layer<any>, any] => {
    return Array.isArray(value) && value.length === 2 && is_layer(value[0]) && value[1] !== undefined
}

export const layer_pair_layer = (layer_pair: [Layer<any>, any]) => layer_pair[0]
export const layer_pair_value = (layer_pair: [Layer<any>, any]) => layer_pair[1]


export const layers_reduce = (object: LayeredObject<any>, reducer: (acc: any, layer_pair: [Layer<any>, any]) => any, initial: any) => {
    return reduce(map(object.annotation_layers(), to_layer_pair_curried(object)), reducer, initial)
}