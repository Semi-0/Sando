import { Layer } from "../Basic/Layer";
import { construct_simple_generic_procedure } from "generic-handler/GenericProcedure";
import { LayeredObject } from "../Basic/LayeredObject";

export class BaseLayer extends Layer{
    constructor(value: any){
        super("base", value)
    }
}


export const get_base_value = construct_simple_generic_procedure("get_base_value", 1, (a: any) => get_base_layer_value(a))

function get_base_layer_value(obj: LayeredObject): any{
    if (obj instanceof LayeredObject){
        return obj.get_layer_value("base")
    }
    else{
        throw new Error(`get_base_layer_value: obj is not a LayeredObject, obj = ${obj}, type = ${typeof obj}`)
    }
}