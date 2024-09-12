import { Layer } from "../Basic/Layer"
import { default_merge_procedure } from "../Basic/LayerGenerics"
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import { add_layer, LayeredObject } from "../Basic/LayeredObject"
import { guard } from "generic-handler/built_in_generics/other_generic_helper"


// TODO:

interface TimeStampedValue {
    value: any;
    timestamp: number;
}

export class TimeLayer extends Layer {
    constructor(timestampedValue: TimeStampedValue) {
        super("time", timestampedValue)
    }

    override get_procedure(name: string, arity: number) {
        return default_merge_procedure(
            (a: TimeStampedValue, b: TimeStampedValue) => ({
                value: b.value,
                timestamp: Math.max(a.timestamp, b.timestamp)
            }),
            { value: undefined, timestamp: 0 }
        )
    }
}

//TODO:
export function annotate_time(base: any, value?: any) {
    const timestamp = Date.now()
    const timestampedValue: TimeStampedValue = {
        value: value !== undefined ? value : base,
        timestamp: timestamp
    }
    return add_layer(base, new TimeLayer(timestampedValue))
}

export function has_time_layer(a: LayeredObject): boolean {
    return a.has_layer("time")
}

export function get_time_layer_value(a: LayeredObject): TimeStampedValue {
    guard(has_time_layer(a), () => { throw new Error("No time layer") })
    return a.get_layer_value("time")
}

export const the_time_layer = new TimeLayer({ value: undefined, timestamp: 0 })