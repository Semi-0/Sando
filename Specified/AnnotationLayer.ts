import { guard } from "generic-handler/built_in_generics/other_generic_helper";
import { Layer } from "../Basic/Layer";
import { add_layer, is_layered_object, LayeredObject } from "../Basic/LayeredObject";
import { default_merge_procedure } from "../Basic/LayerGenerics";
import { add } from "generic-handler/built_in_generics/generic_arithmetic"

export class AnnotationLayer extends Layer{
    constructor(value: string){
        super("annotation", [value])
    }

    override get_procedure(name: string, arity: number) {
        return default_merge_procedure((a: [string], b: [string]) => {return add(a, b)}, [])
    }
}   


export function annotate(base: any, annotation: any): LayeredObject{
    return add_layer(base, new AnnotationLayer(annotation))
}

export function has_annotation_layer(a: LayeredObject): boolean{
    return a.has_layer("annotation")
} 

export function get_annotation_layer_value(a: LayeredObject): string{
    guard(has_annotation_layer(a), () => {throw new Error("No annotation layer")})
    return a.get_layer_value("annotation")
}