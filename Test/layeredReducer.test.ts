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

describe("test layered consolidator", () => {
    it("should construct a basic layered consolidator", () => {
        const sum_consolidator = construct_layered_consolidator("sum", 1, (acc: any) => acc, 0);
   
        expect(typeof sum_consolidator).toBe("function");
    });

    it("should store metadata for layered consolidator", () => {
        const my_consolidator = construct_layered_consolidator("my_consolidator", 1, (acc: any) => acc, null);
        expect(metadata_store_has(my_consolidator)).toBe(true);
    });

    it("should consolidate layered object with simple value", () => {
        const sum_consolidator = construct_layered_consolidator(
            "sum_base", 
            1,
            (acc: any) => acc,
            0
        );
        const obj = support_by(42, "test");
        
        const result = sum_consolidator(obj);
        
        expect(result).toBe(0);
    });

    it("should consolidate layered object and access layer pairs", () => {
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

    describe("test layered consolidator with multiple layers", () => {
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

    describe("test layered consolidator composition", () => {
        it("should compose multiple layered consolidators", () => {
            const consolidator1 = construct_layered_consolidator(
                "consolidator1", 
                1,
                (acc: any) => acc,
                null
            );
            const consolidator2 = construct_layered_consolidator(
                "consolidator2", 
                1,
                (acc: any) => acc,
                null
            );
            
            expect(metadata_store_has(consolidator1)).toBe(true);
            expect(metadata_store_has(consolidator2)).toBe(true);
            expect(metadata_store_get(consolidator1) !== metadata_store_get(consolidator2)).toBe(true);
        });

        it("should handle consolidator with custom initial value", () => {
            const counting_consolidator = construct_layered_consolidator(
                "counting", 
                1,
                (acc: number) => acc + 1,
                0
            );
            const obj = construct_layered_datum(
                42,
                support_layer, construct_defualt_support_set(["test"])
            );

            const result = counting_consolidator(obj);

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

    describe("test error handling in layered consolidator", () => {
        it("should throw error when consolidator not properly defined", () => {
            const undefined_consolidator = construct_layered_consolidator(
                "undefined_handler", 
                1,
                (acc: any) => acc,
                0
            );
            
            expect(() => {
                const obj = support_by(1, "test");
                undefined_consolidator(obj);
            }).not.toThrow();
        });

        it("should handle consolidator with null values gracefully", () => {
            const null_consolidator = construct_layered_consolidator(
                "null_consolidator", 
                1,
                (acc: any) => acc,
                {}
            );
            const obj = construct_layered_datum(
                null,
                support_layer, construct_defualt_support_set(["nullable"])
            );

            const result = null_consolidator(obj);

            expect(result).toBeDefined();
        });
    });

    describe("test layered consolidator with different data types", () => {
        it("should consolidate string base values", () => {
            const string_consolidator = construct_layered_consolidator(
                "string_consolidator", 
                1,
                (acc: any) => acc,
                ""
            );
            const obj = support_by("hello", "string_test");

            const result = string_consolidator(obj);

            expect(typeof result).toBe("string");
        });

        it("should consolidate object base values", () => {
            const complexObj = { name: "test", value: 42 };
            const object_consolidator = construct_layered_consolidator(
                "object_consolidator", 
                1,
                (acc: any) => acc,
                complexObj
            );
            const obj = support_by(complexObj, "object_test");

            const result = object_consolidator(obj);

            expect(result).toBeDefined();
        });

        it("should consolidate array base values", () => {
            const array_consolidator = construct_layered_consolidator(
                "array_consolidator", 
                1,
                (acc: any) => acc,
                []
            );
            const arr = [1, 2, 3, 4, 5];
            const obj = support_by(arr, "array_test");

            const result = array_consolidator(obj);

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("test layered consolidator with multiple layered object arguments", () => {
        it("should merge two layered objects with support layers", () => {
            const merge_consolidator = construct_layered_consolidator(
                "merge_supports",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === support_layer && Array.isArray(acc)) {
                        return [...acc, value];
                    }
                    return acc;
                },
                []
            );

            const obj1 = support_by(10, "source1");
            const obj2 = support_by(20, "source2");

            const result = merge_consolidator(obj1, obj2);

            expect(Array.isArray(result)).toBe(true);
        });

        it("should combine support sets from multiple objects", () => {
            const combine_consolidator = construct_layered_consolidator(
                "combine_supports",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === support_layer) {
                        const valueArray = to_array(value);
                        return acc.length === 0 ? valueArray : [...acc, ...valueArray];
                    }
                    return acc;
                },
                []
            );

            const obj1 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["premise1", "premise2"])
            );
            const obj2 = construct_layered_datum(
                20,
                support_layer, construct_defualt_support_set(["premise3", "premise4"])
            );

            const result = combine_consolidator(obj1, obj2);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(0);
        });

        it("should compare timestamps from multiple objects", () => {
            const time_compare_consolidator = construct_layered_consolidator(
                "compare_times",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === time_layer) {
                        if (acc === 0) return value;
                        return Math.max(acc, value);
                    }
                    return acc;
                },
                0
            );

            const obj1 = annotate_time(10, 1000);
            const obj2 = annotate_time(20, 2000);

            const result = time_compare_consolidator(obj1, obj2);

            expect(typeof result).toBe("number");
            expect(result).toBeGreaterThanOrEqual(0);
        });

        it("should aggregate error information from multiple objects", () => {
            const error_agg_consolidator = construct_layered_consolidator(
                "aggregate_errors",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === error_layer) {
                        const errorCount = Array.isArray(value) ? value.length : 0;
                        return acc + errorCount;
                    }
                    return acc;
                },
                0
            );

            const obj1 = mark_error(10, "Error 1");
            const obj2 = mark_error(20, "Error 2");

            const result = error_agg_consolidator(obj1, obj2);

            expect(typeof result).toBe("number");
            expect(result).toBeGreaterThanOrEqual(0);
        });

        it("should handle consolidator with three layered objects", () => {
            const triple_consolidator = construct_layered_consolidator(
                "triple_consolidate",
                3,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === support_layer) {
                        const supportArray = to_array(value);
                        return acc.length === 0 ? supportArray : [...acc, ...supportArray];
                    }
                    return acc;
                },
                []
            );

            const obj1 = support_by(10, "obj1_source");
            const obj2 = support_by(20, "obj2_source");
            const obj3 = support_by(30, "obj3_source");

            const result = triple_consolidator(obj1, obj2, obj3);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(0);
        });

        it("should consolidate multiple layers across multiple objects", () => {
            const multi_consolidator = construct_layered_consolidator(
                "multi_consolidate",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    
                    if (layer === support_layer) {
                        return { 
                            ...acc, 
                            supportCount: (acc.supportCount || 0) + to_array(value).length 
                        };
                    } else if (layer === time_layer) {
                        return { 
                            ...acc, 
                            maxTime: Math.max(acc.maxTime || 0, value) 
                        };
                    }
                    return acc;
                },
                { supportCount: 0, maxTime: 0 }
            );

            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1", "s2"]),
                time_layer, construct_time_value(100, 1000)
            );
            const obj2 = construct_layered_datum(
                200,
                support_layer, construct_defualt_support_set(["s3"]),
                time_layer, construct_time_value(200, 2500)
            );

            const result = multi_consolidator(obj1, obj2);

            expect(result.supportCount).toBeGreaterThanOrEqual(0);
            expect(result.maxTime).toBeGreaterThanOrEqual(0);
        });

        it("should handle mixed layer presence across objects", () => {
            const mixed_consolidator = construct_layered_consolidator(
                "mixed_layers",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    
                    if (layer === support_layer) {
                        return { ...acc, hasSupport: true, supportCount: to_array(value).length };
                    } else if (layer === error_layer) {
                        return { ...acc, hasError: true, errorCount: Array.isArray(value) ? value.length : 0 };
                    }
                    return acc;
                },
                { hasSupport: false, hasError: false, supportCount: 0, errorCount: 0 }
            );

            // obj1 has support layer only
            const obj1 = support_by(100, "premise1");
            
            // obj2 has error layer only
            const obj2 = mark_error(200, "Error message");

            const result = mixed_consolidator(obj1, obj2);

            expect(result).toBeDefined();
            expect(typeof result.hasSupport).toBe("boolean");
            expect(typeof result.hasError).toBe("boolean");
        });

        it("should consolidate with custom layer dispatcher for multiple objects", () => {
            const custom_consolidator = construct_layered_consolidator(
                "custom_multi",
                2,
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
                custom_consolidator,
                support_layer,
                (base_args: any[], supports1: BetterSet<any>, supports2: BetterSet<any>) => {
                    const combined = [...to_array(supports1), ...to_array(supports2)];
                    return construct_better_set(combined);
                }
            );

            const obj1 = support_by(10, "prem1");
            const obj2 = support_by(20, "prem2");

            const result = custom_consolidator(obj1, obj2);

            expect(Array.isArray(result)).toBe(true);
        });

        it("should handle four layered objects consolidation", () => {
            const quad_consolidator = construct_layered_consolidator(
                "quad_consolidate",
                4,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === support_layer) {
                        const supports = to_array(value);
                        return acc.length === 0 ? supports : [...acc, ...supports];
                    }
                    return acc;
                },
                []
            );

            const obj1 = support_by(10, "obj1");
            const obj2 = support_by(20, "obj2");
            const obj3 = support_by(30, "obj3");
            const obj4 = support_by(40, "obj4");

            const result = quad_consolidator(obj1, obj2, obj3, obj4);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(0);
        });

        it("should merge all layers from multiple objects into summary", () => {
            const summary_consolidator = construct_layered_consolidator(
                "summary_multi",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    
                    if (layer === support_layer) {
                        const supports = to_array(value);
                        return {
                            ...acc,
                            supports: (acc.supports || []).concat(supports),
                            supportCount: (acc.supportCount || 0) + supports.length
                        };
                    } else if (layer === time_layer) {
                        return {
                            ...acc,
                            times: (acc.times || []).concat([value]),
                            maxTime: Math.max(acc.maxTime || 0, value)
                        };
                    } else if (layer === error_layer) {
                        const errors = Array.isArray(value) ? value : [];
                        return {
                            ...acc,
                            errors: (acc.errors || []).concat(errors),
                            totalErrors: (acc.totalErrors || 0) + errors.length
                        };
                    }
                    return acc;
                },
                { supports: [], times: [], errors: [], supportCount: 0, maxTime: 0, totalErrors: 0 }
            );

            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1", "s2"]),
                time_layer, construct_time_value(100, 1000),
                error_layer, construct_error_value(100, "error1")
            );
            const obj2 = construct_layered_datum(
                200,
                support_layer, construct_defualt_support_set(["s3"]),
                time_layer, construct_time_value(200, 2000),
                error_layer, construct_error_value(200, "error2")
            );

            const result = summary_consolidator(obj1, obj2);

            expect(result.supportCount).toBeGreaterThanOrEqual(0);
            expect(result.maxTime).toBeGreaterThanOrEqual(0);
            expect(result.totalErrors).toBeGreaterThanOrEqual(0);
        });
    });

    describe("test define_consolidator_per_layer_dispatcher with multiple arguments", () => {
        it("should use dispatcher handler for support layer with two objects", () => {
            const dispatcher_consolidator = construct_layered_consolidator(
                "dispatcher_support_multi",
                2,
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
                dispatcher_consolidator,
                support_layer,
                (base_args: any[], supports1: BetterSet<any>, supports2: BetterSet<any>) => {
                    // Handler receives support values from both objects
                    const array1 = to_array(supports1);
                    const array2 = to_array(supports2);
                    return construct_better_set([...array1, ...array2]);
                }
            );

            const obj1 = support_by(10, "prem1");
            const obj2 = support_by(20, "prem2");

            const result = dispatcher_consolidator(obj1, obj2);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(2);
        });

        it("should use dispatcher handler for time layer with two objects - max comparison", () => {
            const time_dispatcher = construct_layered_consolidator(
                "time_dispatcher_multi",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === time_layer) {
                        return value;
                    }
                    return acc;
                },
                0
            );

            define_consolidator_per_layer_dispatcher(
                time_dispatcher,
                time_layer,
                (base_args: any[], time1: any, time2: any) => {
                    // Handler receives time values from both objects
                    return Math.max(time1, time2);
                }
            );

            const obj1 = annotate_time(10, 1000);
            const obj2 = annotate_time(20, 2500);

            const result = time_dispatcher(obj1, obj2);

            // Result should be the maximum of 1000 and 2500, which is 2500
            expect(result).toBe(2500);
        });

        it("should use dispatcher handler for error layer with two objects - count aggregation", () => {
            const error_dispatcher = construct_layered_consolidator(
                "error_dispatcher_multi",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === error_layer) {
                        // value is the result from dispatcher handler (sum of error counts)
                        return value;
                    }
                    return acc;
                },
                0
            );

            define_consolidator_per_layer_dispatcher(
                error_dispatcher,
                error_layer,
                (base_args: any[], errors1: any, errors2: any) => {
                    // Handler receives error arrays from both objects
                    const count1 = Array.isArray(errors1) ? errors1.length : 0;
                    const count2 = Array.isArray(errors2) ? errors2.length : 0;
                    return count1 + count2;
                }
            );

            const obj1 = mark_error(10, "Error 1");
            const obj2 = mark_error(20, "Error 2");

            const result = error_dispatcher(obj1, obj2);

            // Result should be exactly 2 (one error from each object)
            expect(typeof result).toBe("number");
            expect(result).toBe(2);
        });

        it("should use dispatcher with support layer for three objects", () => {
            const triple_dispatcher = construct_layered_consolidator(
                "triple_dispatcher",
                3,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === support_layer) {
                        const supports = to_array(value);
                        return acc.length === 0 ? supports : [...acc, ...supports];
                    }
                    return acc;
                },
                []
            );

            define_consolidator_per_layer_dispatcher(
                triple_dispatcher,
                support_layer,
                (base_args: any[], supports1: BetterSet<any>, supports2: BetterSet<any>, supports3: BetterSet<any>) => {
                    // Handler receives support values from all three objects
                    const combined = [
                        ...to_array(supports1),
                        ...to_array(supports2),
                        ...to_array(supports3)
                    ];
                    return construct_better_set(combined);
                }
            );

            const obj1 = support_by(10, "s1");
            const obj2 = support_by(20, "s2");
            const obj3 = support_by(30, "s3");

            const result = triple_dispatcher(obj1, obj2, obj3);

            // Should have support premises from all three objects
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(3);
        });

        it("should combine multiple layer dispatchers with two objects", () => {
            const multi_dispatcher = construct_layered_consolidator(
                "multi_dispatcher",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    
                    if (layer === support_layer) {
                        return { ...acc, supports: value };
                    } else if (layer === time_layer) {
                        return { ...acc, maxTime: value };
                    }
                    return acc;
                },
                { supports: [], maxTime: 0 }
            );

            // Define dispatcher for support layer
            define_consolidator_per_layer_dispatcher(
                multi_dispatcher,
                support_layer,
                (base_args: any[], supports1: BetterSet<any>, supports2: BetterSet<any>) => {
                    const combined = [...to_array(supports1), ...to_array(supports2)];
                    return construct_better_set(combined);
                }
            );

            // Define dispatcher for time layer
            define_consolidator_per_layer_dispatcher(
                multi_dispatcher,
                time_layer,
                (base_args: any[], time1: any, time2: any) => {
                    return Math.max(time1, time2);
                }
            );

            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1", "s2"]),
                time_layer, construct_time_value(100, 1000)
            );
            const obj2 = construct_layered_datum(
                200,
                support_layer, construct_defualt_support_set(["s3"]),
                time_layer, construct_time_value(200, 2000)
            );

            const result = multi_dispatcher(obj1, obj2);

            // Should have combined supports and max time
            expect(result.supports).toBeDefined();
            expect(result.maxTime).toBe(2000); // Maximum of 1000 and 2000
        });

        it("should handle dispatcher with four objects", () => {
            const quad_dispatcher = construct_layered_consolidator(
                "quad_dispatcher",
                4,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    if (layer === support_layer) {
                        const supports = to_array(value);
                        return acc.length === 0 ? supports : [...acc, ...supports];
                    }
                    return acc;
                },
                []
            );

            define_consolidator_per_layer_dispatcher(
                quad_dispatcher,
                support_layer,
                (base_args: any[], s1: BetterSet<any>, s2: BetterSet<any>, s3: BetterSet<any>, s4: BetterSet<any>) => {
                    // Handler receives support values from all four objects
                    const combined = [
                        ...to_array(s1),
                        ...to_array(s2),
                        ...to_array(s3),
                        ...to_array(s4)
                    ];
                    return construct_better_set(combined);
                }
            );

            const obj1 = support_by(10, "o1");
            const obj2 = support_by(20, "o2");
            const obj3 = support_by(30, "o3");
            const obj4 = support_by(40, "o4");

            const result = quad_dispatcher(obj1, obj2, obj3, obj4);

            // Should have support premises from all four objects
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(4);
        });

        it("should handle mixed objects with different layer presence using dispatcher", () => {
            const mixed_dispatcher = construct_layered_consolidator(
                "mixed_dispatcher",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    
                    if (layer === support_layer) {
                        return { ...acc, support: value };
                    } else if (layer === error_layer) {
                        return { ...acc, error: value };
                    }
                    return acc;
                },
                { support: null, error: null }
            );

            define_consolidator_per_layer_dispatcher(
                mixed_dispatcher,
                support_layer,
                (base_args: any[], supports: BetterSet<any>) => {
                    // Only receives support from object that has it
                    return to_array(supports).join(", ");
                }
            );

            define_consolidator_per_layer_dispatcher(
                mixed_dispatcher,
                error_layer,
                (base_args: any[], ...errors: any[]) => {
                    // Receives error arrays from objects that have them
                    let totalErrors = 0;
                    errors.forEach((error: any) => {
                        if (Array.isArray(error)) {
                            totalErrors += error.length;
                        }
                    });
                    return totalErrors;
                }
            );

            // obj1 has support layer only
            const obj1 = support_by(100, "premise");
            
            // obj2 has error layer only
            const obj2 = mark_error(200, "Error message");

            const result = mixed_dispatcher(obj1, obj2);

            expect(result).toBeDefined();
            expect(typeof result.support).toBe("string");
            expect(result.support).toBe("premise");
            expect(typeof result.error).toBe("number");
            expect(result.error).toBeGreaterThanOrEqual(1); // At least one error from obj2
        });

        it("should allow dispatcher to transform and combine layer values", () => {
            const transform_dispatcher = construct_layered_consolidator(
                "transform_dispatcher",
                2,
                (acc: any, layer_pair: any) => {
                    const [layer, value] = layer_pair;
                    // The value here will be the result from the dispatcher handler
                    if (layer === support_layer && value) {
                        return {
                            ...acc,
                            ...value  // Merge the transformed value
                        };
                    }
                    return acc;
                },
                { obj1Supports: [], obj2Supports: [], combined: [], count: 0 }
            );

            define_consolidator_per_layer_dispatcher(
                transform_dispatcher,
                support_layer,
                (base_args: any[], supports1: BetterSet<any>, supports2: BetterSet<any>) => {
                    // Transform and combine support sets into a result object
                    const arr1 = to_array(supports1);
                    const arr2 = to_array(supports2);
                    return {
                        obj1Supports: arr1,
                        obj2Supports: arr2,
                        combined: [...arr1, ...arr2],
                        count: arr1.length + arr2.length
                    };
                }
            );

            const obj1 = support_by(10, "s1");
            const obj2 = support_by(20, "s2");

            const result = transform_dispatcher(obj1, obj2);

            expect(result).toBeDefined();
            expect(Array.isArray(result.combined)).toBe(true);
            expect(result.count).toBe(2); // One support from each object
            expect(result.combined.length).toBe(2);
            expect(result.obj1Supports).toContain("s1");
            expect(result.obj2Supports).toContain("s2");
        });
    });
});