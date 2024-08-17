import { BetterSet, construct_better_set } from "generic-handler/built_in_generics/generic_better_set"
import { add } from "generic-handler/built_in_generics/generic_arithmetic"
import { Layer } from "../Basic/Layer"
import { default_merge_procedure } from "../Basic/LayerGenerics"
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import { add_layer, is_layered_object, LayeredObject } from "../Basic/LayeredObject"
import { guard } from "generic-handler/built_in_generics/other_generic_helper"

export class SupportLayer<T> extends Layer{

    constructor(set: BetterSet<T>){
        super("support", set)
    }

    override get_procedure(name: string, arity: number) {
        return default_merge_procedure(add, construct_better_set([], (a: T) => to_string(a)))
    }
}

export function support_by(base: any, support: string){
    return add_layer(base, new SupportLayer(construct_better_set([], (a: string) => to_string(a))))
}

export function has_support_layer(a: LayeredObject): boolean{
    return a.has_layer("support")
}

export function get_support_layer_value(a: LayeredObject): BetterSet<string>{
    guard(has_support_layer(a), () => {throw new Error("No support layer")})
    return a.get_layer_value("support")
}

