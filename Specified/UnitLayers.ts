import { Layer } from "../Basic/Layer"


export function get_unit_procedure(name: string, arity: number){
    if (name === "square" && arity === 1){
        return (b: any, ...vs: any) => {
            return vs[0] * vs[0]
        }
        // TODO: add more unit procedures
    }
    else{
        return undefined
    }
}


export class UnitLayer extends Layer{
    constructor( value: any){
        super("unit", value, (b: any, ...v: any) => v)
    }

    override get_procedure(name: string, arity: number): any | undefined{
        return get_unit_procedure(name, arity)
    }
}

export const the_unit_layer = new UnitLayer(undefined)