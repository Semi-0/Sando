import { register_predicate } from "generic-handler/Predicates";


export function is_bundled_obj(identifier: string): (value: any) => boolean{
    return  (value: any): boolean=> {
        return typeof value === "object" && value !== null && "identifier" in value && value.identifier === identifier
    }
}