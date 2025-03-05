import { get_base_value } from "./Basic/Layer"
import { is_layered_object, type LayeredObject } from "./Basic/LayeredObject"
import { type Layer } from "./Basic/Layer"
import { get_length, filter, set_some, set_every } from "generic-handler/built_in_generics/generic_better_set"

export function layered_base_equal<T>(value1: any | LayeredObject<T>, value2: any | LayeredObject<T>): boolean{
    return get_base_value(value1) === get_base_value(value2)
}

export function deep_equal<T>(obj1: any | LayeredObject<T>, obj2: any | LayeredObject<T>): boolean {
    // Check if the objects are strictly equal (same reference)
    if (obj1 === obj2) return true;
  
    // Check if either is null or not an object
    if (typeof obj1 !== 'object' || obj1 === null ||
        typeof obj2 !== 'object' || obj2 === null) {
      return obj1 === obj2;
    }
  
    // Get the keys of both objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
  
    // Check if the number of keys is the same
    if (keys1.length !== keys2.length) return false;
  
    // Check each key-value pair recursively
    for (let key of keys1) {
      if (!keys2.includes(key) || !deep_equal(obj1[key], obj2[key])) {
        console.log(obj1[key], obj2[key])
        return false;
      }
    }
  
    return true;
  }
  

export function layered_deep_equal<T>(value1: LayeredObject<T>, value2: LayeredObject<T>): boolean {
    if (!is_layered_object(value1) || !is_layered_object(value2)) {
        throw new Error("Both arguments must be LayeredObjects");
    }

    // Compare base values first
    if (!layered_base_equal(value1, value2)) {
        return false;
    }

    const layers1 = value1.annotation_layers()
    const layers2 = value2.annotation_layers()
  
    // Compare number of layers
    if (get_length(layers1) !== get_length(layers2)) {
        return false;
    }

    // Check if all layers are equal
    return set_every(layers1, (layer: Layer<T>) => {
        return layer.is_equal(value1, value2)
    }) && set_every(layers2, (layer: Layer<T>) => {
        return layer.is_equal(value2, value1)
    })

}
