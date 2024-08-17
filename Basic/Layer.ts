
export class Layer{
    name: string
    value: any | undefined


    constructor(name: string, value: any | undefined, procedure: any | undefined = undefined){
        this.name = name
        this.value = value

    }

    get_name(): string{
        return this.name
    }

    has_value(): boolean{
        return this.value !== undefined
    }

    get_value(): any{
        return this.value
    }

    get_procedure(name: string, arity: number): any | undefined{
        return undefined
    }
}


export function is_layer(value: any): value is Layer{
    return value instanceof Layer
}