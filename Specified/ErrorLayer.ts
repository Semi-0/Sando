// import { type BetterSet, construct_better_set, merge_set } from "generic-handler/built_in_generics/generic_better_set"
// import { type Layer } from "../Basic/Layer"
// import { default_merge_procedure } from "../Basic/LayerGenerics"
// import { to_string } from "generic-handler/built_in_generics/generic_conversation"
// import { add_layer, is_layered_object, construct_layer_interface, type LayeredObject, update_layer_value } from "../Basic/LayeredObject"
// import { guard, throw_error } from "generic-handler/built_in_generics/other_generic_helper"
// import { is_array } from "generic-handler/built_in_generics/generic_predicates"


// export class StandardError {
//     constructor(
//         readonly msg: string,
//         readonly base_value: any,
//     ) {}
// }

// export function construct_error_layer(): Layer{
//     function get_name(): string{
//         return "error"
//     }

//     function has_value(): boolean{
//         return true
//     }

//     function get_value
    
    
// }



// export function has_error_layer(a: LayeredObject): boolean {
//     return a.has_layer("error")
// }

// export function get_error_layer_value(a: LayeredObject): StandardError[] {
//     guard(has_error_layer(a), () => { throw new Error("No error layer") })
//     return a.get_layer_value("error")
// }

// export const the_error_layer = new ErrorLayer([])

// export const annotate_error = construct_layer_interface(the_error_layer, (new_value: any, old_values: any[]) => {
//     guard(is_array(old_values), throw_error("annotate_error", "Old values are not an array", "old_values: " + to_string(old_values)))
//     return [...old_values, new_value]
// })