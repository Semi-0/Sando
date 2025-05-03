import { is_string } from "generic-handler/built_in_generics/generic_predicates"

import {  base_layer, construct_empty_layers_set, get_base_value, get_layer_name, is_layer, layers_set_merge, type Layer } from "./Layer"
import { construct_layered_object, get_alist_pair_name, get_annotation_layers, type LayeredObject } from "./LayeredObject"
import { pipe } from "fp-ts/lib/function"
import { map, reduce } from "generic-handler/built_in_generics/generic_array_operation"
import { set_add_item, construct_better_set, set_filter, set_find, is_better_set, map_to_new_set, set_merge, type BetterSet } from "generic-handler/built_in_generics/generic_better_set"
import { register_predicate } from "generic-handler/Predicates";
import { is_bundled_obj } from "./Bundle";

//TODO: first layer procedure: To String

export interface LayeredProcedureMetadata {
    identifier: string;
    name: string;
    arity: number;
    base_procedure: (...args: any) => any;
    handlers: BetterSet<[string, (b: any, ...v: any) => any]>;
    get_name(): string;
    get_base_procedure(): (...args: any) => any;
    set_handler(name: string, handler: (b: any, ...v: any) => any): void;
    get_handler(layer: Layer<any>): ((b: any, ...v: any) => any) ;
}

export function construct_layered_procedure_metadata(name: string, arity: number, base_proc: (...args: any) => any): LayeredProcedureMetadata {
    var handlers = construct_better_set<[string, (b: any, ...v: any) => any]>([], ([name, _]) => name);

    function get_name(): string {
        return name;
    }

    function get_base_procedure(): (...args: any) => any {
        return base_proc;
    }

    function set_handler(name: string, handler: (b: any, ...v: any) => any): void {
        handlers = set_add_item(handlers, [name, handler]);
    }

    function get_handler(layer: Layer<any>): ((b: any, ...v: any) => any)  {
        const layerName = layer.get_name();
        const handler = set_find(([name, _]) => name === layerName, handlers);
        if (handler) {
            return handler[1];
        } else {
            return layer.get_procedure(name, arity);
        }
    }

    return {
        identifier: "layered_procedure_metadata",
        name,
        arity,
        base_procedure: base_proc,
        handlers,
        get_name,
        get_base_procedure,
        set_handler,
        get_handler
    };
}

export const is_layered_procedure_metadata = register_predicate("is_layered_procedure_metadata", (a: any): a is LayeredProcedureMetadata => {
    return is_bundled_obj("layered_procedure_metadata")(a);
});


const meta_data_store = new Map< ( arg: any ) =>any, LayeredProcedureMetadata>()

function set_layered_procedure_metadata(proc: (arg: any) => any, metadata: LayeredProcedureMetadata){
    meta_data_store.set(proc, metadata)
}

export function make_layered_procedure<T>(name: string, arity: number, base_proc: (...v: any) => T): (...args : any) => LayeredObject<T>{
    const metadata = construct_layered_procedure_metadata(name, arity, base_proc)
    const the_layered_procedure = (...args: any[]) => layered_procedure_dispatch<T>(metadata, ...args)
    set_layered_procedure_metadata(the_layered_procedure, metadata)
    return the_layered_procedure
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

export const merge_annotation_layers = (...args: LayeredObject<any>[]) => reduce(args.map(get_annotation_layers), layers_set_merge, construct_empty_layers_set())
 

function layered_procedure_dispatch<T>(metaData: LayeredProcedureMetadata, ...args: any[]) {
        const base_procedure = metaData.get_base_procedure();
        const base_value = base_procedure(...map(args, get_base_value))
        const annotation_layers : BetterSet<Layer<any>> =  merge_annotation_layers(...args)

        return construct_layered_object<T>(
            base_value,

            pipe(annotation_layers, 
                (s: BetterSet<Layer<any>>) => set_filter(s, (l: Layer<any>) => l.get_name() !== "base"),
                (s: BetterSet<Layer<any>>) => map_to_new_set(s, (layer: Layer<any>): [Layer<any>, any] => {
                    const handler = metaData.get_handler(layer); 
                    return [layer, handler(base_value, ...args.map(a => layer.get_value(a)))];
                }, get_alist_pair_name))
            )
 };



