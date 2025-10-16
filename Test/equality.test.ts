import { describe, it, expect, beforeEach } from "bun:test";
import { layered_deep_equal, layers_base_equal, layers_length_equal, all_layers_value_equal } from "../Equality";
import { support_by, support_layer, construct_defualt_support_set } from "../Specified/SupportLayer";
import { mark_error, error_layer, construct_error_value } from "../Specified/ErrorLayer";
import { annotate_time, time_layer, construct_time_value } from "../Specified/TimeLayer";
import { construct_layered_datum } from "../Basic/LayeredDatum";
import { get_base_value } from "../Basic/Layer";
import { is_equal } from "generic-handler/built_in_generics/generic_arithmetic";

describe("test equality functions", () => {
    describe("layers_base_equal", () => {
        it("should compare primitive base values correctly", () => {
            const obj1 = support_by(42, "test");
            const obj2 = support_by(42, "test");
            expect(layers_base_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different primitive base values", () => {
            const obj1 = support_by(42, "test");
            const obj2 = support_by(43, "test");
            expect(layers_base_equal(obj1, obj2)).toBe(false);
        });

        it("should compare string base values correctly", () => {
            const obj1 = support_by("hello", "test");
            const obj2 = support_by("hello", "test");
            expect(layers_base_equal(obj1, obj2)).toBe(true);
        });

        it("should compare object base values by equality", () => {
            const obj1 = support_by({ a: 1, b: 2 }, "test");
            const obj2 = support_by({ a: 1, b: 2 }, "test");
            expect(layers_base_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different object base values", () => {
            const obj1 = support_by({ a: 1 }, "test");
            const obj2 = support_by({ a: 2 }, "test");
            expect(layers_base_equal(obj1, obj2)).toBe(false);
        });

        it("should work with array base values", () => {
            const obj1 = support_by([1, 2, 3], "test");
            const obj2 = support_by([1, 2, 3], "test");
            expect(layers_base_equal(obj1, obj2)).toBe(true);
        });
    });

    describe("layers_length_equal", () => {
        it("should return true for same layer count", () => {
            const obj1 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(10, 1000)
            );
            const obj2 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["s2"]),
                time_layer, construct_time_value(10, 2000)
            );
            expect(layers_length_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different layer counts", () => {
            const obj1 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["s1"])
            );
            const obj2 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(10, 1000)
            );
            expect(layers_length_equal(obj1, obj2)).toBe(false);
        });

        it("should return true for single layer objects with same layer count", () => {
            const obj1 = support_by(42, "test");
            const obj2 = support_by(100, "other");
            expect(layers_length_equal(obj1, obj2)).toBe(true);
        });
    });

    describe("all_layers_value_equal", () => {
        it("should compare support layer values correctly", () => {
            const obj1 = support_by(42, "test");
            const obj2 = support_by(42, "test");
            expect(all_layers_value_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different support values", () => {
            const obj1 = support_by(42, "test");
            const obj2 = support_by(42, "other");
            expect(all_layers_value_equal(obj1, obj2)).toBe(false);
        });

        it("should compare multiple layers correctly", () => {
            const obj1 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(10, 1000)
            );
            const obj2 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(10, 1000)
            );
            expect(all_layers_value_equal(obj1, obj2)).toBe(true);
        });

        it("should return false when one layer value differs", () => {
            const obj1 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(10, 1000)
            );
            const obj2 = construct_layered_datum(
                10,
                support_layer, construct_defualt_support_set(["s2"]),
                time_layer, construct_time_value(10, 1000)
            );
            expect(all_layers_value_equal(obj1, obj2)).toBe(false);
        });

        it("should handle error layer values", () => {
            const obj1 = mark_error(42, "Test error");
            const obj2 = mark_error(42, "Test error");
            expect(all_layers_value_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different error messages", () => {
            const obj1 = mark_error(42, "Error 1");
            const obj2 = mark_error(42, "Error 2");
            expect(all_layers_value_equal(obj1, obj2)).toBe(false);
        });
    });

    describe("layered_deep_equal - basic cases", () => {
        it("should return true for identical simple layered objects", () => {
            const obj1 = support_by(42, "test");
            const obj2 = support_by(42, "test");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different base values", () => {
            const obj1 = support_by(42, "test");
            const obj2 = support_by(43, "test");
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });

        it("should return false for different layer values", () => {
            const obj1 = support_by(42, "test1");
            const obj2 = support_by(42, "test2");
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });

        it("should handle string base values", () => {
            const obj1 = support_by("hello", "src");
            const obj2 = support_by("hello", "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should handle object base values", () => {
            const obj1 = support_by({ x: 1, y: 2 }, "src");
            const obj2 = support_by({ x: 1, y: 2 }, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should handle array base values", () => {
            const obj1 = support_by([1, 2, 3], "src");
            const obj2 = support_by([1, 2, 3], "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });
    });

    describe("layered_deep_equal - multiple layers", () => {
        it("should compare objects with support and time layers", () => {
            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(100, 1000)
            );
            const obj2 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(100, 1000)
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should return false when time layer differs", () => {
            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(100, 1000)
            );
            const obj2 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(100, 2000)
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });

        it("should compare objects with three layers", () => {
            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(100, 1000),
                error_layer, construct_error_value(100, "error")
            );
            const obj2 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(100, 1000),
                error_layer, construct_error_value(100, "error")
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should return false when one layer is missing", () => {
            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1"]),
                time_layer, construct_time_value(100, 1000)
            );
            const obj2 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1"])
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });
    });

    describe("layered_deep_equal - multiple support values", () => {
        it("should compare objects with multiple support values", () => {
            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1", "s2", "s3"])
            );
            const obj2 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1", "s2", "s3"])
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different number of support values", () => {
            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1", "s2"])
            );
            const obj2 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1", "s2", "s3"])
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });

        it("should handle order-independent support set comparison", () => {
            // Support sets are unordered, so order shouldn't matter
            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s1", "s2", "s3"])
            );
            const obj2 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["s3", "s1", "s2"])
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });
    });

    describe("layered_deep_equal - error cases", () => {
        it("should compare error layer values", () => {
            const obj1 = mark_error(100, "Error message");
            const obj2 = mark_error(100, "Error message");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different error messages", () => {
            const obj1 = mark_error(100, "Error 1");
            const obj2 = mark_error(100, "Error 2");
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });

        it("should handle compound values with errors and support", () => {
            const obj1 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["premise"]),
                error_layer, construct_error_value(100, "error")
            );
            const obj2 = construct_layered_datum(
                100,
                support_layer, construct_defualt_support_set(["premise"]),
                error_layer, construct_error_value(100, "error")
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });
    });

    describe("layered_deep_equal - complex nested cases", () => {
        it("should handle nested object base values", () => {
            const obj1 = support_by({ a: { b: { c: 1 } } }, "src");
            const obj2 = support_by({ a: { b: { c: 1 } } }, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different nested objects", () => {
            const obj1 = support_by({ a: { b: { c: 1 } } }, "src");
            const obj2 = support_by({ a: { b: { c: 2 } } }, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });

        it("should handle mixed nested structures", () => {
            const obj1 = support_by(
                { values: [1, 2, 3], nested: { key: "value" } },
                "src"
            );
            const obj2 = support_by(
                { values: [1, 2, 3], nested: { key: "value" } },
                "src"
            );
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });
    });

    describe("layered_deep_equal - edge cases", () => {
        it("should handle null base values", () => {
            const obj1 = support_by(null, "src");
            const obj2 = support_by(null, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should handle undefined base values", () => {
            const obj1 = support_by(undefined, "src");
            const obj2 = support_by(undefined, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should handle boolean base values", () => {
            const obj1 = support_by(true, "src");
            const obj2 = support_by(true, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for different boolean values", () => {
            const obj1 = support_by(true, "src");
            const obj2 = support_by(false, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });

        it("should handle zero and non-zero numbers", () => {
            const obj1 = support_by(0, "src");
            const obj2 = support_by(0, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should return false for zero vs non-zero", () => {
            const obj1 = support_by(0, "src");
            const obj2 = support_by(1, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(false);
        });

        it("should handle empty arrays", () => {
            const obj1 = support_by([], "src");
            const obj2 = support_by([], "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });

        it("should handle empty objects", () => {
            const obj1 = support_by({}, "src");
            const obj2 = support_by({}, "src");
            expect(layered_deep_equal(obj1, obj2)).toBe(true);
        });
    });

    describe("is_equal for better sets (support layer)", () => {
        it("should compare support sets with same elements", () => {
            const set1 = construct_defualt_support_set(["a", "b", "c"]);
            const set2 = construct_defualt_support_set(["a", "b", "c"]);
            expect(is_equal(set1, set2)).toBe(true);
        });

        it("should compare support sets regardless of order", () => {
            const set1 = construct_defualt_support_set(["a", "b", "c"]);
            const set2 = construct_defualt_support_set(["c", "a", "b"]);
            expect(is_equal(set1, set2)).toBe(true);
        });

        it("should return false for different support sets", () => {
            const set1 = construct_defualt_support_set(["a", "b"]);
            const set2 = construct_defualt_support_set(["a", "b", "c"]);
            expect(is_equal(set1, set2)).toBe(false);
        });
    });
});
