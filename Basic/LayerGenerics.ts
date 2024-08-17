import { construct_simple_generic_procedure } from "generic-handler/GenericProcedure"

export function default_merge_procedure(op: (a: any, b: any) => any, initial: any): any{
    return (base: any, ...values: any[]) => {
        return values.reduce((acc, value) => {
            return op(acc, value)
        }, initial)
    }
}


