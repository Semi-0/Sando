// TODO:
// Put a sticky note on a procedure, but still maintain its interface

import { layer_accessor, make_annotation_layer, type Layer } from "./Basic/Layer"
import { default_merge_procedure } from "./Basic/LayerGenerics"
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import { construct_layer_ui, type LayeredObject } from "./Basic/LayeredObject"


const stickyNoteMap = new Map<any, LayeredObject>();


export function is_procedure_with_sticky_note(procedure: any): boolean {
    return stickyNoteMap.has(procedure)
} 

export function stick(procedure: (...args: any[]) => any, sticky_note: (obj: any) => LayeredObject): (...args: any[]) => any {
    if (is_procedure_with_sticky_note(procedure)) {
        const obj = retrieve_layers(procedure)
        add_sticky_note(obj, sticky_note(obj))
    }
    else {
        const sticky_note_value = sticky_note(procedure)
        add_sticky_note(procedure, sticky_note_value)
    }
    return procedure
}

export function add_sticky_note(procedure: any, layeredObject: LayeredObject): any {
    stickyNoteMap.set(procedure, layeredObject);
    return procedure;
}

export function retrieve_layers(procedure: any): LayeredObject | undefined {
    return stickyNoteMap.get(procedure);
}