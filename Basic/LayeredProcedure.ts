import { map, remove_duplicates } from "generic-handler/built_in_generics/generic_array"
import { get_base_value } from "../Specified/BaseLayer"
import { is_layer, Layer } from "./Layer"
import { LayeredObject } from "./LayeredObject"
import {  option } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { filterMap } from "fp-ts/lib/Array"
import { is_string } from "generic-handler/built_in_generics/generic_predicates"

class LayeredProcedureMetadata{
    name: string 
    arity: number
    base_procedure: (...args: any) => any
    handlers: Map<string, (b:any, ...v:any) => any>

    constructor(name: string, arity: number, base_proc: (v: any) => any){
        this.name = name
        this.arity = arity
        this.base_procedure = base_proc
        this.handlers = new Map<string, (b:any, v:any) => any>()
    }


    get_name(): string{
        return this.name
    }

    get_base_procedure(): (...args: any) => any{
        return this.base_procedure
    }

    private has(name: string): boolean{
        return this.handlers.has(name)
    }

    private get(name: string): ((b:any, ...v: any) => any) | undefined{
        if (this.has(name)){
            return this.handlers.get(name)
        }
        else{
            return undefined
        }
    }

    set_handler(name: string, handler: (b:any, ...v: any) => any){
        this.handlers.set(name, handler)
    }

    get_handler(layer: Layer): ((b:any, ...v: any) => any) | undefined{
        if (this.has(layer.get_name())){
            return this.get(layer.get_name())
        }
        else{
            return layer.get_procedure(this.name, this.arity)
        }
    }

}


const meta_data_store = new Map< ( arg: any ) =>any, LayeredProcedureMetadata>()

function set_layered_procedure_metadata(proc: (arg: any) => any, metadata: LayeredProcedureMetadata){
    meta_data_store.set(proc, metadata)
}

export function make_layered_procedure(name: string, arity: number, base_proc: (...v: any) => any): (...args : any) => any{
    const metadata = new LayeredProcedureMetadata(name, arity, base_proc)
    set_layered_procedure_metadata(base_proc, metadata)
    return layed_procedure_dispatch(metadata)
}

function get_layered_procedure_metadata(proc: (...args: any) => any): LayeredProcedureMetadata | undefined{
    return meta_data_store.get(proc)
}



export function define_layered_procedure_handler(procedure: (...args: any) => any, layer: any, handler: (b: any, ...v: any) => any){
    if (is_string(layer)){
        _define_layered_procedure_handler(procedure, layer, handler)
    }
    else if (is_layer(layer)){
        _define_layered_procedure_handler(procedure, layer.get_name(), handler)
    }
    else{
        throw new Error("define_layered_procedure_handler: layer must be a string or a Layer")
    }
}



function _define_layered_procedure_handler(procedure: (...args: any) => any, layer: string, handler: (b: any, ...v: any) => any){
    const metadata = get_layered_procedure_metadata(procedure)
    if (metadata){
        metadata.set_handler(layer, handler)
    }
    else{
        throw new Error(`define_layered_procedure_handler: procedure = ${procedure} not found`)
    }
}

function layed_procedure_dispatch(metaData: LayeredProcedureMetadata) {
    return (...args: LayeredObject[]) => {
        const base_procedure = metaData.get_base_procedure();
        const base_values = map(args, get_base_value)
        const _base_value = base_procedure(...base_values)
        const annotation_layers : Layer[] = remove_duplicates(
            args.map(a => a.get_annotation_layers()).flat(),
            (a: Layer) => a.get_name()
        );        

        return new LayeredObject(
            _base_value,

            pipe(annotation_layers, filterMap((layer: Layer) => {
                const handler = metaData.get_handler(layer);
                if (handler) {
                    return  option.some( new Layer(layer.get_name(), handler(_base_value, ...args.map(a => a.get_layer_value(layer.get_name())))))
                }
                else{
                    return  option.none
                }
            })
        ));
    };
}

