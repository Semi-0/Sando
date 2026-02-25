/**
 * Vector clock layer for LayeredObject serialization.
 * Provides constant_clock, vector_clock_layer, and load_vector_clock_serializer_deserializer.
 * Browser-safe: no Propogator, Effect, or Node dependencies.
 */
import { is_any } from "generic-handler/built_in_generics/generic_predicates"
import { define_generic_procedure_handler } from "generic-handler/GenericProcedure"
import { match_args, register_predicate } from "generic-handler/Predicates"
import { make_annotation_layer, type Layer } from "../Basic/Layer"
import {
    deserialize_per_layer,
    serialize_layer_value,
} from "../Basic/LayeredSerializer"

const VECTOR_CLOCK_LAYER_NAME = "vector_clock"

type SourceID = string
type Clock = number | string
type VectorClock = Map<SourceID, number>

export const constant_clock = "constant"

export const is_constant_clock = (clock: unknown): boolean => clock === constant_clock

const vector_clock_get_source = (source: SourceID, vector_clock: VectorClock): Clock => {
   const v = vector_clock.get(source)
   return v === undefined ? 0 : v
}

const vector_clock_set_source = (source: SourceID, value: number, vector_clock: VectorClock): VectorClock => {
   vector_clock.set(source, value)
   return vector_clock
}

const compare_two_clock = (a: Clock, b: Clock): number => {
   if (is_constant_clock(a) && is_constant_clock(b)) return 0
   if (is_constant_clock(a)) return -1
   if (is_constant_clock(b)) return 1
   if ((a as number) > (b as number)) return 1
   if ((a as number) < (b as number)) return -1
   return 0
}

const max_clock = (a: Clock, b: Clock): Clock =>
   compare_two_clock(a, b) > 0 ? a : b

type VectorClockOrConstant = Map<SourceID, number> | string

const version_vector_merge = (v1: unknown, v2: unknown): VectorClockOrConstant => {
   if (is_constant_clock(v1)) return v2 as VectorClockOrConstant
   if (is_constant_clock(v2)) return v1 as VectorClockOrConstant
   if (!(v1 instanceof Map) || !(v2 instanceof Map)) return new Map()
   const result = new Map(v1)
   v2.forEach((value: number, source: SourceID) => {
      vector_clock_set_source(
         source,
         max_clock(vector_clock_get_source(source, result) as Clock, value as Clock) as number,
         result
      )
   })
   return result
}

export const vector_clock_layer: Layer<VectorClock> = make_annotation_layer<VectorClock, unknown>(
   VECTOR_CLOCK_LAYER_NAME,
   (get_name, has_value, get_value, summarize_self) => ({
      get_name,
      has_value,
      get_value,
      get_default_value: () => new Map(),
      get_procedure: (_name: string, _arity: number) =>
         (_base: VectorClock, ...values: VectorClock[]) =>
            values.reduce<VectorClockOrConstant>(
               (acc, v) => version_vector_merge(acc, v),
               new Map() as VectorClockOrConstant
            ),
      summarize_self,
   })
)

function vector_clock_to_json_safe(value: unknown): unknown {
   if (is_constant_clock(value)) return value
   if (value instanceof Map) return Object.fromEntries(value)
   return value
}

function json_safe_to_vector_clock(value: unknown): Map<string, number> | string {
   if (value === constant_clock) return constant_clock
   if (value != null && typeof value === "object" && !(value instanceof Map)) {
      const entries = Object.entries(value).filter(
         (entry): entry is [string, number] =>
            typeof entry[0] === "string" && typeof entry[1] === "number"
      )
      return new Map(entries)
   }
   return new Map()
}

const is_vector_clock_layer_string = register_predicate(
   "is_vector_clock_layer_string",
   (name: unknown) => name === VECTOR_CLOCK_LAYER_NAME
)

let _loaded = false

export function load_vector_clock_serializer_deserializer(): void {
   if (_loaded) return
   define_generic_procedure_handler(
      serialize_layer_value,
      match_args(is_vector_clock_layer_string, is_any),
      (_name: string, value: unknown) => vector_clock_to_json_safe(value)
   )
   define_generic_procedure_handler(
      deserialize_per_layer,
      match_args(is_vector_clock_layer_string, is_any),
      (_name: string, value: unknown) => ({
         layer: vector_clock_layer,
         serialized_value: json_safe_to_vector_clock(value),
      })
   )
   _loaded = true
}
