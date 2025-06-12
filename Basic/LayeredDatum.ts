import type { BetterSet } from "generic-handler/built_in_generics/generic_better_set";
import type { Layer } from "./Layer";
import { construct_layered_object, make_alist } from "./LayeredObject";
import { add_item } from "generic-handler/built_in_generics/generic_collection";


export const plist_to_alist = (plist: any[]) => {
    // plist: Layer, Value
    const loop = (index: number, acc: BetterSet<[Layer<any>, any]>): BetterSet<[Layer<any>, any]> => {
        if (index >= plist.length) {
            return acc
        }
        return loop(index + 2, add_item(acc, [plist[index], plist[index + 1]]))
    }
    return loop(0, make_alist([]))
}

export const construct_layered_datum = (base_value: any, ...plist: any[]) => {
    return construct_layered_object(base_value, plist_to_alist(plist))
}
   

