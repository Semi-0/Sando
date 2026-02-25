import { describe, it, expect } from "bun:test";
import type { LayeredObject } from "../Basic/LayeredObject";
import { construct_layered_datum } from "../Basic/LayeredDatum";
import {
    json_layered_object_serializer,
    json_layered_object_deserializer,
    deserialize_layered_object_from_obj,
    deserialize_per_layer,
    base_deserializer,
    serialize_layer_value,
    is_serialized_layered_object,
    type Per_Layer_Deserialized_Result,
} from "../Basic/LayeredSerializer";
import { support_by } from "../Specified/SupportLayer";
import { layered_deep_equal } from "../Equality";
import { get_base_value } from "../Basic/Layer";

const asLayeredObject = (x: unknown): LayeredObject<unknown> => x as LayeredObject<unknown>;

describe("LayeredSerializer", () => {
    describe("json_layered_object_serializer", () => {
        it("should serialize base-only layered object to JSON object format", () => {
            const obj = construct_layered_datum(42);
            const serialized = json_layered_object_serializer(obj);
            const parsed = JSON.parse(serialized);
            expect(parsed).toEqual({ base: 42 });
        });

        it("should serialize layered object with string base value", () => {
            const obj = construct_layered_datum("hello");
            const serialized = json_layered_object_serializer(obj);
            const parsed = JSON.parse(serialized);
            expect(parsed).toEqual({ base: "hello" });
        });

        it("should serialize layered object with object base value", () => {
            const obj = construct_layered_datum({ a: 1, b: 2 });
            const serialized = json_layered_object_serializer(obj);
            const parsed = JSON.parse(serialized);
            expect(parsed).toEqual({ base: { a: 1, b: 2 } });
        });

        it("should include annotation layers in serialized output", () => {
            const obj = support_by(10, "test");
            const serialized = json_layered_object_serializer(obj);
            const parsed = JSON.parse(serialized);
            expect(parsed).toHaveProperty("base", 10);
            expect(parsed).toHaveProperty("support");
        });
    });

    describe("json_layered_object_deserializer", () => {
        it("should deserialize base-only JSON to layered object", () => {
            const json = '{"base": 42}';
            const deserialized = asLayeredObject(json_layered_object_deserializer(json));
            expect(get_base_value(deserialized)).toBe(42);
        });

        it("should deserialize string base value", () => {
            const json = '{"base": "hello"}';
            const deserialized = asLayeredObject(json_layered_object_deserializer(json));
            expect(get_base_value(deserialized)).toBe("hello");
        });

        it("should deserialize object base value", () => {
            const json = '{"base": {"a": 1, "b": 2}}';
            const deserialized = asLayeredObject(json_layered_object_deserializer(json));
            expect(get_base_value(deserialized)).toEqual({ a: 1, b: 2 });
        });

        it("should throw when base layer is missing", () => {
            const json = '{"other": 123}';
            expect(() => json_layered_object_deserializer(json)).toThrow(/deserialize_layered_object/);
        });

        it("should throw on invalid JSON", () => {
            expect(() => json_layered_object_deserializer("not valid json")).toThrow(/deserialize_layered_object/);
        });
    });

    describe("round-trip (base-only)", () => {
        it("should round-trip base-only primitive", () => {
            const obj = construct_layered_datum(42);
            const serialized = json_layered_object_serializer(obj);
            const deserialized = asLayeredObject(json_layered_object_deserializer(serialized));
            expect(layered_deep_equal(obj, deserialized)).toBe(true);
        });

        it("should round-trip base-only string", () => {
            const obj = construct_layered_datum("hello");
            const serialized = json_layered_object_serializer(obj);
            const deserialized = asLayeredObject(json_layered_object_deserializer(serialized));
            expect(layered_deep_equal(obj, deserialized)).toBe(true);
        });

        it("should round-trip base-only object", () => {
            const obj = construct_layered_datum({ x: 1, y: 2 });
            const serialized = json_layered_object_serializer(obj);
            const deserialized = asLayeredObject(json_layered_object_deserializer(serialized));
            expect(layered_deep_equal(obj, deserialized)).toBe(true);
        });

        it("should round-trip base-only array", () => {
            const obj = construct_layered_datum([1, 2, 3]);
            const serialized = json_layered_object_serializer(obj);
            const deserialized = asLayeredObject(json_layered_object_deserializer(serialized));
            expect(layered_deep_equal(obj, deserialized)).toBe(true);
        });
    });

    describe("deserialize_per_layer", () => {
        it("should return base layer result when name is 'base'", () => {
            const result = deserialize_per_layer("base", 42) as Per_Layer_Deserialized_Result;
            expect(result).toBeDefined();
            expect(result.layer.get_name()).toBe("base");
            expect(result.serialized_value).toBe(42);
        });

        it("should return undefined for unknown layer names (no handler)", () => {
            const result = deserialize_per_layer("unknown_layer", "value");
            expect(result).toBeUndefined();
        });
    });

    describe("serialize_layer_value", () => {
        it("should pass through value unchanged by default (no custom handler)", () => {
            expect(serialize_layer_value("base", 42)).toBe(42)
            expect(serialize_layer_value("support", "test")).toBe("test")
            expect(serialize_layer_value("unknown", { a: 1 })).toEqual({ a: 1 })
        })
    })

    describe("deserialize_layered_object_from_obj", () => {
        it("should deserialize parsed object without JSON round-trip", () => {
            const parsed = { base: 42 }
            const deserialized = asLayeredObject(deserialize_layered_object_from_obj(parsed))
            expect(get_base_value(deserialized)).toBe(42)
        })

        it("should match json_layered_object_deserializer result", () => {
            const obj = construct_layered_datum({ x: 1, y: 2 })
            const json = json_layered_object_serializer(obj)
            const parsed = JSON.parse(json) as Record<string, unknown>
            const fromObj = asLayeredObject(deserialize_layered_object_from_obj(parsed))
            const fromStr = asLayeredObject(json_layered_object_deserializer(json))
            expect(layered_deep_equal(fromObj, fromStr)).toBe(true)
        })
    })

    describe("is_serialized_layered_object", () => {
        it("should return true for object with base key", () => {
            expect(is_serialized_layered_object({ base: 42 })).toBe(true)
            expect(is_serialized_layered_object({ base: "hello", other: 1 })).toBe(true)
        })

        it("should return false for null, array, primitives", () => {
            expect(is_serialized_layered_object(null)).toBe(false)
            expect(is_serialized_layered_object([])).toBe(false)
            expect(is_serialized_layered_object(42)).toBe(false)
            expect(is_serialized_layered_object("foo")).toBe(false)
        })

        it("should return false for object without base key", () => {
            expect(is_serialized_layered_object({ other: 42 })).toBe(false)
            expect(is_serialized_layered_object({})).toBe(false)
        })
    })

    describe("base_deserializer", () => {
        it("should pass through value unchanged", () => {
            expect(base_deserializer(42)).toBe(42);
            expect(base_deserializer("hello")).toBe("hello");
            expect(base_deserializer({ a: 1 })).toEqual({ a: 1 });
        });
    });

    describe("error handling", () => {
        it("should throw on serializer error with object context", () => {
            const circular: Record<string, unknown> = { a: 1 };
            circular.self = circular;
            const obj = construct_layered_datum(circular);
            expect(() => json_layered_object_serializer(obj)).toThrow();
        });
    });
});
