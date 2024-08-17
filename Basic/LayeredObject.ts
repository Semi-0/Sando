import { Layer } from "./Layer";

export class LayeredObject{
    readonly alist: Layer[]

    constructor(base_value: any, alist: Layer[] | null){
        if (alist === null){
            this.alist = [new Layer("base", base_value)]
        } else {
            console.log("alist = ", alist)
            this.alist = [new Layer("base", base_value), ...alist]
        }
    }

    has_layers(): boolean{
        return this.alist.length > 0
    }

    has_layer(name: string): boolean{
        return this.alist.some(l => l.get_name() === name)
    }

    get_layer(name: string): Layer | undefined{
        return this.alist.find(l => l.get_name() === name)
    }

    get_layer_value(layer: string): any | undefined{
        return this.get_layer(layer)?.get_value()
    }

    get_annotations(): string[] {
        return this.alist.map(l => l.get_name())
    }

    get_annotation_layers(): Layer[]{
        return this.alist.filter(l => l.get_name() !== "base")
    }

    map(proc: (base: any, value: any) => any): any{
        //@ts-ignore
        const base_value = this.get_layer_value("base")
        return new LayeredObject(base_value, 
                this.alist.map((v: any) => {
                    return proc(base_value, v)
                })
            )
    }
}

export function add_layer(obj: LayeredObject | any, layer: Layer): LayeredObject{
    if (is_layered_object(obj)){
        return new LayeredObject(obj.get_layer_value("base"), [...obj.get_annotation_layers(), layer])
    } else {
        return new LayeredObject(obj, [layer])
    }
} 

export function is_layered_object(a: any): a is LayeredObject{
    return a instanceof LayeredObject
}
