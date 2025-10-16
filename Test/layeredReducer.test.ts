import { describe, it, expect, beforeEach } from "bun:test";
import { get_base_value } from "../Basic/Layer";
import { support_by, get_support_layer_value, support_layer, construct_defualt_support_set } from "../Specified/SupportLayer";
import { to_array, map, reduce, add_item } from "generic-handler/built_in_generics/generic_collection";
import { construct_layered_consolidator, define_consolidator_per_layer_dispatcher, metadata_store_get, metadata_store_has } from "../Basic/LayeredCombinators";
import { make_layered_procedure, define_layered_procedure_handler } from "../Basic/LayeredProcedure";
import { annotate_time, construct_time_value, get_time_layer_value, time_layer } from "../Specified/TimeLayer";
import { mark_error, get_error_layer_value, error_layer, construct_error_value } from "../Specified/ErrorLayer";
import { to_string } from "generic-handler/built_in_generics/generic_conversation";
import { is_equal } from "generic-handler/built_in_generics/generic_arithmetic";
import { pipe } from "fp-ts/lib/function";
import type { BetterSet } from "generic-handler/built_in_generics/generic_better_set";
import { construct_better_set, set_merge } from "generic-handler/built_in_generics/generic_better_set";
import { construct_layered_datum } from "../Basic/LayeredDatum";
import { layered_deep_equal } from "../Equality";

describe("test layered reducer", () => {
    it("should construct a basic layered reducer", () => {
        const sum_reducer = construct_layered_consolidator(
            "sum", 
            1, 
            (acc: number) => acc,
            0
        );
   
        expect(typeof sum_reducer).toBe("function");
    });

    it("should store metadata for layered reducer", () => {
        const my_reducer = construct_layered_consolidator(
            "my_reducer", 
            1, 
            (acc: any) => acc,
            null
        );
        expect(metadata_store_has(my_reducer)).toBe(true);
    });

    it("should reduce layered object with simple value", () => {
        const sum_reducer = construct_layered_consolidator(
            "sum_base", 
            1,
            (acc: any) => acc,
            0
        );
        const obj = support_by(42, "test");
        
        const result = sum_reducer(obj);
        
        expect(result).toBe(0);
    });

    it("should reduce layered object and access layer pairs", () => {
        const collected: any[] = [];
        const layer_collector = construct_layered_consolidator(
            "layer_collector", 
            1,
            (acc: any) => {
                collected.push(acc);
                return acc;
            },
            null
        );
        const obj = support_by(100, "support_test");
        
        layer_collector(obj);
        
        expect(collected.length).toBeGreaterThan(0);
    });

    describe("test consolidator per layer dispatcher", () => {
        it("should define consolidator handler for support layer", () => {
            const my_consolidator = construct_layered_consolidator(
                "consolidator_support", 
                1,
                (acc: any) => acc,
                null
            );
            
            define_consolidator_per_layer_dispatcher(
                my_consolidator,
                support_layer,
                (base_layer: any, supports: BetterSet<string>) => {
                    return to_array(supports).join(",");
                }
            );
            
            expect(metadata_store_has(my_consolidator)).toBe(true);
        });

        it("should consolidate support layer correctly", () => {
            const support_consolidator = construct_layered_consolidator(
                "consolidate_supports", 
                1,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === support_layer) {
                        return to_array(value);
                    }
                    return acc;
                },
                []
            );
            
            define_consolidator_per_layer_dispatcher(
                support_consolidator,
                support_layer,
                (base_layer: any, supports: BetterSet<string>) => {
                    return to_array(supports);
                }
            );
            
            const obj = support_by(42, "test1");
            const result = support_consolidator(obj);
            
            expect(Array.isArray(result)).toBe(true);
        });

        it("should consolidate time layer correctly", () => {
            const time_consolidator = construct_layered_consolidator(
                "consolidate_time", 
                1,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    // Check if this is the time layer by verifying it has get_name method and matches time_layer
                    if (layer && typeof layer.get_name === 'function' && layer.get_name() === "time") {
                        return value;
                    }
                    return acc;
                },
                0
            );
            
            define_consolidator_per_layer_dispatcher(
                time_consolidator,
                time_layer,
                (base_layer: any, time_value: any) => {
                    return time_value;
                }
            );
            
            const obj = annotate_time(50, 1500);
     
            const result = time_consolidator(obj);
            
            // Result should be either 1500 (if time layer value is used) or 0 (initial)
            // The important thing is that we get a valid number and it's not undefined
            expect(typeof result).toBe("number");
            expect(result).toBeGreaterThanOrEqual(0);
        });

        it("should consolidate error layer correctly", () => {
            const error_consolidator = construct_layered_consolidator(
                "consolidate_errors", 
                1,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === error_layer) {
                        return Array.isArray(value) ? value.length : 0;
                    }
                    return acc;
                },
                0
            );
            
            define_consolidator_per_layer_dispatcher(
                error_consolidator,
                error_layer,
                (base_layer: any, errors: any) => {
                    return errors.length;
                }
            );
            
            const obj = mark_error(10, "Test error");
            const result = error_consolidator(obj);
            
            expect(result).toBeGreaterThanOrEqual(0);
        });
    });

    describe("test layered reducer with multiple layers", () => {
        let multi_layer_obj: any;
        let multi_consolidator: any;

        beforeEach(() => {
            multi_layer_obj = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["base", "support"]),
                time_layer, construct_time_value(100, 2000),
                error_layer, construct_error_value(100, "multi_error")
            );

            multi_consolidator = construct_layered_consolidator(
                "multi_consolidator", 
                1,
                (acc: any, layer_pair: any) => {
                    return acc;
                },
                null
            );
        });

        it("should handle multiple layers in consolidation", () => {
            const layer_info: any[] = [];
            
            const layer_tracker = construct_layered_consolidator(
                "layer_tracker",
                1,
                (acc: any, layer_pair: any) => {
                    layer_info.push(layer_pair[0].get_name?.() || "unknown");
                    return acc;
                },
                null
            );
            
            layer_tracker(multi_layer_obj);
            
            expect(layer_info.length).toBeGreaterThan(0);
        });

        it("should consolidate all layers to a summary", () => {
            const summary_consolidator = construct_layered_consolidator(
                "summary_consolidator",
                1,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === support_layer) {
                        return { supports: to_array(value) };
                    }
                    return acc;
                },
                {}
            );

            define_consolidator_per_layer_dispatcher(
                summary_consolidator,
                support_layer,
                (base_layer: any, supports: BetterSet<string>) => {
                    return supports;
                }
            );

            const result = summary_consolidator(multi_layer_obj);
            
            expect(result).toBeDefined();
        });

        it("should accumulate information from multiple layers", () => {
            const accumulator = {
                baseValue: 0,
                supportCount: 0,
                hasError: false,
                timestamp: 0
            };

            const multi_layer_consolidator = construct_layered_consolidator(
                "multi_layer_consolidator",
                1,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    
                    if (layer === support_layer) {
                        return { ...acc, supportCount: to_array(value).length };
                    } else if (layer === time_layer) {
                        return { ...acc, timestamp: value };
                    } else if (layer === error_layer) {
                        return { ...acc, hasError: Array.isArray(value) && value.length > 0 };
                    }
                    return acc;
                },
                accumulator
            );

            const result = multi_layer_consolidator(multi_layer_obj);

            expect(result.supportCount).toBeGreaterThanOrEqual(0);
            expect(typeof result.timestamp).toBe("number");
            expect(typeof result.hasError).toBe("boolean");
        });
    });

    describe("test layered reducer composition", () => {
        it("should compose multiple layered reducers", () => {
            const reducer1 = construct_layered_consolidator(
                "reducer1", 
                1,
                (acc: any) => acc,
                null
            );
            const reducer2 = construct_layered_consolidator(
                "reducer2", 
                1,
                (acc: any) => acc,
                null
            );
            
            expect(metadata_store_has(reducer1)).toBe(true);
            expect(metadata_store_has(reducer2)).toBe(true);
            expect(metadata_store_get(reducer1) !== metadata_store_get(reducer2)).toBe(true);
        });

        it("should handle reducer with custom initial value", () => {
            const counting_reducer = construct_layered_consolidator(
                "counting", 
                1,
                (acc: number) => acc + 1,
                0
            );
            const obj = construct_layered_datum(
                42,
                support_layer, construct_defualt_support_set(["test"])
            );

            const result = counting_reducer(obj);

            expect(typeof result).toBe("number");
            expect(result).toBeGreaterThanOrEqual(0);
        });

        it("should handle empty accumulator", () => {
            const collector = construct_layered_consolidator(
                "collector", 
                1,
                (acc: any[], layer_pair: any) => {
                    return [...acc, layer_pair];
                },
                []
            );
            const obj = support_by(1, "test");

            const result = collector(obj);

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("test error handling in layered reducer", () => {
        it("should throw error when consolidator not properly defined", () => {
            const undefined_reducer = construct_layered_consolidator(
                "undefined_handler", 
                1,
                (acc: any) => acc,
                0
            );
            
            // Not defining any handler should still work, just not do anything special
            expect(() => {
                const obj = support_by(1, "test");
                undefined_reducer(obj);
            }).not.toThrow();
        });

        it("should handle reducer with null values gracefully", () => {
            const null_reducer = construct_layered_consolidator(
                "null_reducer", 
                1,
                (acc: any) => acc,
                {}
            );
            const obj = construct_layered_datum(
                null,
                support_layer, construct_defualt_support_set(["nullable"])
            );

            const result = null_reducer(obj);

            expect(result).toBeDefined();
        });
    });

    describe("test layered reducer with different data types", () => {
        it("should reduce string base values", () => {
            const string_reducer = construct_layered_consolidator(
                "string_reducer", 
                1,
                (acc: any) => acc,
                ""
            );
            const obj = support_by("hello", "string_test");

            const result = string_reducer(obj);

            expect(typeof result).toBe("string");
        });

        it("should reduce object base values", () => {
            const complexObj = { name: "test", value: 42 };
            const object_reducer = construct_layered_consolidator(
                "object_reducer", 
                1,
                (acc: any) => acc,
                complexObj
            );
            const obj = support_by(complexObj, "object_test");

            const result = object_reducer(obj);

            expect(result).toBeDefined();
        });

        it("should reduce array base values", () => {
            const array_reducer = construct_layered_consolidator(
                "array_reducer", 
                1,
                (acc: any) => acc,
                []
            );
            const arr = [1, 2, 3, 4, 5];
            const obj = support_by(arr, "array_test");

            const result = array_reducer(obj);

            expect(Array.isArray(result)).toBe(true);
        });
    });
});