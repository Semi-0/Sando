import { log_tracer } from "generic-handler/built_in_generics/generic_debugger"
import { layers_reduce } from "./helper"
import type { Layer } from "./Layer"
import type { LayeredObject } from "./LayeredObject"
import { define_layered_procedure_handler, make_layered_procedure } from "./LayeredProcedure"


// layered reducer is a reducer that reduce an layered object into a single value
// maybe we should stored the metadata? 
type LayeredProcedure = (...args: any[]) => LayeredObject<any>
type LayeredReducer = (...objects: LayeredObject<any>[]) => any

const metadata_store = new Map<LayeredReducer, LayeredProcedure>()

export const metadata_store_has = (procedure: LayeredReducer) => {
    return metadata_store.has(procedure)
}

export const metadata_store_get = (procedure: LayeredReducer) => {
    return metadata_store.get(procedure)
}

export { metadata_store }

export const construct_layered_consolidator = (name: string = "layered_reducer", arity: number = 1, reducer: (acc: any, initial: any) => any, initial: any) => {
    const internal =  make_layered_procedure(name + "_dispatcher", arity, (...args: any[]) => args)
    const the_procedure = (...objects: LayeredObject<any>[]) => {
        const assessed_result = internal(objects)
        return layers_reduce(assessed_result,  reducer, initial)
    }
    metadata_store.set(the_procedure, internal)
    return the_procedure
}


export const define_consolidator_per_layer_dispatcher = (procedure: LayeredReducer, layer: Layer<any>, handler: (b: any[], ...vs: any[]) => any) => {
    const metadata = metadata_store.get(procedure)
    if (metadata) {
        define_layered_procedure_handler(metadata, layer, handler)
    }
    else {
        throw new Error("define_reducer_per_layer_dispatcher: procedure not found")
    }
}
