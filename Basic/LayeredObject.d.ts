// Type declaration file for Vite compatibility
export interface LayeredObject<T> {
    alist: any;
    has_layer(layer: any): boolean;
    get_layer_value(layer: any): any | undefined;
    annotation_layers(): any;
    update_layer(layer: any, value: any): LayeredObject<T>;
    remove_layer(layer: any): LayeredObject<T>;
    summarize_self(): string[]; 
    describe_self(): string;
}
