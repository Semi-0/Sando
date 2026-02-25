import type { LayeredObject } from "./LayeredObject"
import { reduce } from "generic-handler/built_in_generics/generic_collection"
import { base_layer, type Layer } from "./Layer"
import { throw_error } from "generic-handler/built_in_generics/other_generic_helper"
import { construct_simple_generic_procedure, define_generic_procedure_handler } from "generic-handler/GenericProcedure"
import { construct_layered_datum } from "./LayeredDatum"
import { is_any, is_concrete } from "generic-handler/built_in_generics/generic_predicates"
import { match_args, register_predicate } from "generic-handler/Predicates"
// serialize and deserialize layer 

// for serialize its easy we simply serialize the layer name and value 

// for deserializer we need a combinator which takes in combination of layer deserializer and combine them into a layered object

export const serialize_layer_value = construct_simple_generic_procedure(
   "serialize_layer_value",
   2,
   (_name: string, value: any) => value
)

const serialize_layered_object_constructor = (serializer: (value: any) => any) => (object: LayeredObject<any>) => {
   const layers = object.annotation_layers()
   const layer_obj = reduce(
      layers,
      (acc: Record<string, any>, layer: Layer<any>) => {
         acc[layer.get_name()] = serialize_layer_value(layer.get_name(), layer.get_value(object))
         return acc
      },
      {} as Record<string, any>
   )
   try {
      const serialized_value = serializer(layer_obj)
      return serialized_value
   } catch (e) {
      throw_error("serialize_layered_object", "Error serializing layered object:", typeof e === "string" ? e : JSON.stringify(e) + "\n" + object.describe_self())()
   }
}

export const json_layered_object_serializer = serialize_layered_object_constructor(JSON.stringify)


export interface Per_Layer_Deserialized_Result {
    layer: Layer<any>
    serialized_value: any
}

export const deserialize_per_layer = construct_simple_generic_procedure("deserialize_per_layer", 2, (name: string, value: any) => {
    return undefined
})

export const deserialize_layered_object_constructor = (deserializer: (value: string) => any) =>  (value: string) => {
    try{
        const deserialized_obj = deserializer(value)
        var base = undefined  
        var p_list: any[] = []
        for (const [name, value] of Object.entries(deserialized_obj)){
            const result = deserialize_per_layer(name, value) as Per_Layer_Deserialized_Result
            if (is_concrete(result)){
                if (name == "base"){
                    base = result.serialized_value
                }
                else{
                    p_list = [...p_list, result.layer, result.serialized_value]
                }
            }
        }

        if (is_concrete(base)){
            return construct_layered_datum(base, ...p_list)
        }
        else{
            throw_error("deserialize_layered_object", "Base is not concrete", value)()
        }
    }
    catch(e){
        throw_error("deserialize_layered_object", "Error deserializing layered object:", typeof e === "string" ? e : JSON.stringify(e) + "\n" + value)()
    } 
}


export const json_layered_object_deserializer = deserialize_layered_object_constructor(JSON.parse)

const object_layered_object_deserializer = deserialize_layered_object_constructor((x: any) => x)

/** Deserialize from already-parsed object. Avoids JSON.stringify/parse round-trip when you already have the object. */
export const deserialize_layered_object_from_obj = (obj: Record<string, unknown>) =>
   object_layered_object_deserializer(obj as unknown as string) as LayeredObject<unknown>

export const base_deserializer = construct_simple_generic_procedure("base_deserializer", 1, (value: any) => {
    return value
})

export const is_base_layer_string = register_predicate("is_base_layer_string", (value: any) => {
   return value == base_layer().get_name()
})

define_generic_procedure_handler(deserialize_per_layer, match_args(is_base_layer_string, is_any), (name: string, value: any) => {
    return {
        layer: base_layer(),
        serialized_value: base_deserializer(value)
    }
})

/** True if value appears to be a serialized LayeredObject (has "base" key). */
export function is_serialized_layered_object(value: unknown): value is Record<string, unknown> {
   return (
      value != null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "base" in value &&
      Object.prototype.hasOwnProperty.call(value, "base")
   )
}

