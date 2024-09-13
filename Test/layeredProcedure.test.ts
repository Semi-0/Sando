import { add, construct_better_set, merge, to_array, type BetterSet } from "generic-handler/built_in_generics/generic_better_set"
import { get_support_layer_value, support_by, support_layer } from "../Specified/SupportLayer"
import { the_unit_layer } from "../Specified/UnitLayers" 
import { get_base_value } from "../Basic/Layer"



import { describe, it, expect } from "bun:test" 
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import { define_layered_procedure_handler, make_layered_procedure } from "../Basic/LayeredProcedure"
import { pipe } from "fp-ts/lib/function"
import { get_error_layer_value, has_error_layer, make_error_pair, mark_error } from "../Specified/ErrorLayer"


describe("test support layer operation", () => {
    it("should support a layered object", () => {
        const obj = support_by(1, "test")
        expect(to_array(get_support_layer_value(obj))).toEqual(["test"])
    })

    it("should merge support layer with default procedure", () => {
        const obj = support_by(1, "test")
        const obj2 = support_by(2, "test2")
        const test_proc =  make_layered_procedure("test_proc", 1, (a: any, b: any) => a + b)
        const obj3 = test_proc(obj, obj2)
        expect(get_base_value(obj3)).toEqual(3)
        expect(to_array(get_support_layer_value(obj3))).toEqual(["test", "test2"])
    })

    it("should support customized layered procedure", () => {
        const obj = support_by(1, "test")
        const obj2 = support_by(2, "test2")
        const merge_support_string =  make_layered_procedure("merge_support_string", 1, (a: any, b: any) => a + b)

        define_layered_procedure_handler(merge_support_string, support_layer, (base_layer: number, a: BetterSet<string>, b: BetterSet<string>) => {
            return pipe(merge(a, b, a.identify_by), (s: BetterSet<string>) => add(s, to_string(base_layer)))
        })
        const obj3 = merge_support_string(obj, obj2)

        expect(get_base_value(obj3)).toEqual(3)
        expect(to_array(get_support_layer_value(obj3))).toEqual(["test", "test2", "3"])
    })

    it("should work with iterative application of layered procedure", () => {
        const merge_support_string = make_layered_procedure("merge_support_string", 1, (a: any, b: any) => a + b);
        
        define_layered_procedure_handler(merge_support_string, support_layer, (base_layer: number, a: BetterSet<string>, b: BetterSet<string>) => {
            return pipe(merge(a, b, a.identify_by), (s: BetterSet<string>) => add(s, to_string(base_layer)));
        });
    
        const obj1 = support_by(1, "test1");
        const obj2 = support_by(2, "test2");
        const obj3 = support_by(3, "test3");
    
        const result = merge_support_string(merge_support_string(obj1, obj2), obj3);
    
        expect(get_base_value(result)).toEqual(6);
        expect(to_array(get_support_layer_value(result)).sort()).toEqual(["3", "6", "test1", "test2", "test3"]);



    });


    describe("test error layer operations", () => {
        it("should add an error to a layered object", () => {
            const obj = mark_error(1, "Test error")
            expect(has_error_layer(obj)).toBe(true)
            const errors = get_error_layer_value(obj)
            expect(errors.length).toBe(1)
            expect(errors[0].get_error()).toBe("Test error")
            expect(errors[0].get_value()).toBe(1)
        })
    
        it("should merge error layers with default procedure", () => {
            const obj1 = mark_error(1, "Error 1")
            const obj2 = mark_error(2, "Error 2")
            const merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b)
            const result = merge_proc(obj1, obj2)
    
            expect(get_base_value(result)).toBe(3)
            const errors = get_error_layer_value(result)
            expect(errors.length).toBe(2)
            expect(errors[0].get_error()).toBe("Error 1")
            expect(errors[1].get_error()).toBe("Error 2")
        })
    
        it("should handle multiple errors on the same object", () => {
            const obj = mark_error(mark_error(1, "Error 1"), "Error 2")
            const errors = get_error_layer_value(obj)
            expect(errors.length).toBe(2)
            expect(errors[0].get_error()).toBe("Error 2")
            expect(errors[1].get_error()).toBe("Error 1")
        })
    
        it("should correctly use construct_error_value", () => {
            const errorPair = make_error_pair("Test error", 42)
            expect(errorPair.get_error()).toBe("Test error")
            expect(errorPair.get_value()).toBe(42)
        })
    })

    // KNOWN ISSUES: LAYERED PROCEDURES WOULD KILLS TAIL-RECURSION, JAY SUSSMAN SOLVE THE ISSUE BY ALTER THE INTERPRETER
    // it("should support Fibonacci calculation with customized layered procedure", () => {
    //     const fib = make_layered_procedure("fib", 0, (n: number) => {
    //         if (n <= 1) return n;
    //         return fib(n - 1) + fib(n - 2);
    //     });
    
    //     define_layered_procedure_handler(fib, the_support_layer, (base_layer: number, a: BetterSet<string>) => {
    //         return add(a, `fib(${base_layer})`);
    //     });
    
    //     const result = fib(5);
    
    //     expect(get_base_value(result)).toEqual(5);
    //     expect(to_array(get_support_layer_value(result)).sort()).toEqual([
    //         "fib(0)", "fib(1)", "fib(2)", "fib(3)", "fib(4)", "fib(5)"
    //     ]);
    // });
})

// // ... existing imports ...
// import { annotate_error, get_error_layer_value, has_error_layer, StandardError } from "../Specified/ErrorLayer"
// import { base_layer, get_base_value } from "../Basic/Layer"


// // ... existing test suites ...

// describe("test error layer operations", () => {
//     it("should add a minor error to a layered object", () => {
//         const obj = annotate_error(1, "Minor issue")
//         expect(has_error_layer(obj)).toBe(true)
//         expect(get_error_layer_value(obj)).toEqual([new StandardError("Minor issue", 1)])
//     })

//     it("should throw on critical error", () => {
//         expect(() => {
//             annotate_error(1, "Critical issue")
//         }).toThrow("Critical error in layered object: [\"Critical issue\"]")
//     })
//     it("should merge error layers with default procedure", () => {
//         const obj1 = annotate_error(1, new StandardError("Error 1", 1))
//         const obj2 = annotate_error(2, new StandardError("Error 2", 2))
//         const merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b)
//         const result = merge_proc(obj1, obj2)

//         expect(get_base_value(result)).toBe(3)
//         expect(get_error_layer_value(result)).toEqual([
//             new StandardError("Error 1", 1),
//             new StandardError("Error 2", 2)
//         ])
//     })

//     it("should handle multiple errors", () => {
//         const obj = annotate_error(
//             annotate_error(1, new StandardError("Error 1", 1)),
//             new StandardError("Error 2", 1)
//         )
//         expect(get_error_layer_value(obj)).toEqual([
//             new StandardError("Error 1", 1),
//             new StandardError("Error 2", 1)
//         ])
//     })
// })