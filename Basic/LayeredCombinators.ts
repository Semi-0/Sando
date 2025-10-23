import { log_tracer } from "generic-handler/built_in_generics/generic_debugger"
import { layers_reduce } from "./helper"
import { is_base_layer, type Layer } from "./Layer"
import type { LayeredObject } from "./LayeredObject"
import { define_layered_procedure_handler, make_layered_procedure } from "./LayeredProcedure"
import { pipe } from "fp-ts/lib/function"
import { flat_map, to_array } from "generic-handler/built_in_generics/generic_collection"
import { construct_better_set, type BetterSet } from "generic-handler/built_in_generics/generic_better_set"
import { construct_layered_datum } from "./LayeredDatum"

// layered reducer is a reducer that reduce an layered object into a single value
// maybe we should stored the metadata? 
type LayeredProcedure = (...args: any[]) => LayeredObject<any>
type LayeredReducer = (...objects: LayeredObject<any>[] | any[]) => any

const metadata_store = new Map<LayeredReducer, LayeredProcedure>()

export const metadata_store_has = (procedure: LayeredReducer) => {
    return metadata_store.has(procedure)
}

export const metadata_store_get = (procedure: LayeredReducer) => {
    return metadata_store.get(procedure)
}

export { metadata_store }

export const construct_layered_consolidator = (name: string = "layered_reducer", arity: number = 1, reducer: (acc: any[], n: any) => any, initial: any) => {
    const internal =  make_layered_procedure(name + "_dispatcher", arity, (...args: any[]) => args)
    const the_procedure = (...objects: LayeredObject<any>[] | any[]) => {
        const assessed_result = internal(...objects)
        return layers_reduce(assessed_result,  reducer, initial)
    }
    metadata_store.set(the_procedure, internal)
    return the_procedure
}

export const exclude_base_layer = (f: (acc: any, layer_pair: [Layer<any>, any]) => any) => (acc: any, layer_pair: [Layer<any>, any]) => {
    if (is_base_layer(layer_pair[0])) {
        return acc;
    }
    return f(acc, layer_pair);
}



export const define_consolidator_per_layer_dispatcher = (procedure: LayeredReducer, layer: Layer<any>, handler: (b: LayeredObject<any>[] | any[], ...vs: any[]) => any) => {
    const metadata = metadata_store.get(procedure)
    if (metadata) {
        define_layered_procedure_handler(metadata, layer, handler)
    }
    else {
        throw new Error("define_reducer_per_layer_dispatcher: procedure not found")
    }
}




export const push_layer = (object: LayeredObject<any>, layer: Layer<any>, value: any) => {
  return object.update_layer(layer, value)
}

export const pop_layer = (object: LayeredObject<any>, layer: Layer<any>) => {
  return object.remove_layer(layer)
}