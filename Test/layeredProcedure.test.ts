import { add, construct_better_set, get_length, merge, to_array, type BetterSet } from "generic-handler/built_in_generics/generic_better_set"
import { get_support_layer_value, support_by, support_layer } from "../Specified/SupportLayer"

import { get_base_value } from "../Basic/Layer"



import { describe, it, expect } from "bun:test" 
import { to_string } from "generic-handler/built_in_generics/generic_conversation"
import { define_layered_procedure_handler, make_layered_procedure } from "../Basic/LayeredProcedure"
import { pipe } from "fp-ts/lib/function"
import { get_error_layer_value, has_error_layer, make_error_pair, mark_error } from "../Specified/ErrorLayer"
import { annotate_time, get_time_layer_value, has_time_layer } from "../Specified/TimeLayer"


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
})

describe("test time layer operations", () => {
    it("should add a timestamp to a layered object", () => {
        const now = Date.now()
        const obj = annotate_time(1, now)
        expect(has_time_layer(obj)).toBe(true)
        const timeValue = get_time_layer_value(obj)
        expect(timeValue.value).toBe(1)
        expect(timeValue.timestamp).toBe(now)
    })

    it("should use current time if no timestamp provided", () => {
        const before = Date.now()
        const obj = annotate_time(1)
        const after = Date.now()
        const timeValue = get_time_layer_value(obj)
        expect(timeValue.value).toBe(1)
        expect(timeValue.timestamp).toBeGreaterThanOrEqual(before)
        expect(timeValue.timestamp).toBeLessThanOrEqual(after)
    })

    it("should merge time layers with default procedure", () => {
        const obj1 = annotate_time(1, 1000)
        const obj2 = annotate_time(2, 2000)
        const merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b)
        const result = merge_proc(obj1, obj2)

        expect(get_base_value(result)).toBe(3)
        const timeValue = get_time_layer_value(result)
        expect(timeValue.value).toBe(2)
        expect(timeValue.timestamp).toBe(2000)
    })

    it("should keep the latest timestamp when merging", () => {
        const obj1 = annotate_time(1, 2000)
        const obj2 = annotate_time(2, 1000)
        const merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b)
        const result = merge_proc(obj1, obj2)

        expect(get_base_value(result)).toBe(3)
        const timeValue = get_time_layer_value(result)
        expect(timeValue.value).toBe(2)
        expect(timeValue.timestamp).toBe(2000)
    })
})


// ... existing imports ...
import { has_id_layer, get_id_layer_value, mark_id } from "../Specified/IdLayer"
import { v4 as uuidv4 } from 'uuid';
import { layered_object, type LayeredObject } from "../Basic/LayeredObject"

// ... existing test suites ...

describe("test id layer operations", () => {
    it("should add an id to a layered object", () => {
        const obj: LayeredObject = mark_id(1)
        expect(has_id_layer(obj)).toBe(true)
        const idSet: BetterSet<string> = get_id_layer_value(obj)
        expect(get_length(idSet)).toBe(1)
        const id = to_array(idSet)[0]
        expect(typeof id).toBe("string")
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) // UUID v4 format
    })

    it("should merge id layers with default procedure", () => {
        const obj1 = mark_id(1)
        const obj2 = mark_id(2)
        const merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b)
        const result = merge_proc(obj1, obj2)

        expect(get_base_value(result)).toBe(3)
        const idSet = get_id_layer_value(result)
        expect(get_length(idSet)).toBe(2)
    })

    it("should keep unique ids when merging multiple times", () => {
        const obj1 = mark_id(1)
        const obj2 = mark_id(2)
        const obj3 = mark_id(3)
        const merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b)
        const result = merge_proc(merge_proc(obj1, obj2), obj3)

        expect(get_base_value(result)).toBe(6)
        const idSet = get_id_layer_value(result)
        expect(get_length(idSet)).toBe(3)
    })
})

// ... existing imports ...
import { has_log_layer, get_log_layer_value, add_log, make_log_entry } from "../Specified/LogLayer"
import { is_log_entry, is_log_entry_list } from "../Specified/LogLayer"

// ... existing test suites ...

describe("test log layer operations", () => {
    it("should add a log entry to a layered object", () => {
        const obj = add_log(1, "Test log message")
        expect(has_log_layer(obj)).toBe(true)
        const logEntries = get_log_layer_value(obj)
        expect(is_log_entry_list(logEntries)).toBe(true)
        expect(logEntries.length).toBe(1)
        expect(logEntries[0].get_message()).toBe("Test log message")
    })

    it("should merge log layers with default procedure", () => {
        const obj1 = add_log(1, "Log 1")
        const obj2 = add_log(2, "Log 2")
        const merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b)
        const result = merge_proc(obj1, obj2)

        expect(get_base_value(result)).toBe(3)
        const logEntries = get_log_layer_value(result)
        expect(logEntries.length).toBe(2)
        expect(logEntries[0].get_message()).toBe("Log 1")
        expect(logEntries[1].get_message()).toBe("Log 2")
    })

    it("should handle multiple log entries on the same object", () => {
        const obj = add_log(add_log(1, "Log 1"), "Log 2")
        const logEntries = get_log_layer_value(obj)
        expect(logEntries.length).toBe(2)
  
        expect(logEntries[0].get_message()).toBe("Log 1")
        expect(logEntries[1].get_message()).toBe("Log 2")
    })

    it("should correctly use make_log_entry", () => {
        const logEntry = make_log_entry(1, "Test log")
        expect(is_log_entry(logEntry)).toBe(true)
        expect(logEntry.get_message()).toBe("Test log")
        expect(typeof logEntry.get_timestamp()).toBe("number")
    })

    it("should merge log entries correctly", () => {
        const obj1 = add_log(1, "Log 1")
        const obj2 = add_log(2, "Log 2")
        const obj3 = add_log(3, "Log 3")
        const merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b)
        const result = merge_proc(merge_proc(obj1, obj2), obj3)

        expect(get_base_value(result)).toBe(6)
        const logEntries = get_log_layer_value(result)
        expect(logEntries.length).toBe(3)
      
        expect(logEntries[0].get_message()).toBe("Log 1")
        expect(logEntries[1].get_message()).toBe("Log 2")
        expect(logEntries[2].get_message()).toBe("Log 3")
    })
})

import {beforeEach} from "bun:test"

import {
    is_procedure_with_sticky_note,
    stick,
    add_sticky_note,
    retrieve_layers
  } from '../StickyNote';
  
  describe('StickyNoteLayer', () => {
    // Test sticky_note_layer
  
  
    // Test is_procedure_with_sticky_note and stick
    it('is_procedure_with_sticky_note and stick should work correctly', () => {
      const testFunc = () => {};
      expect(is_procedure_with_sticky_note(testFunc)).toBe(false);
  
      const stickyFunc = stick(testFunc, () => ({} as LayeredObject));
      expect(is_procedure_with_sticky_note(stickyFunc)).toBe(true);
    });
  
    // Test add_sticky_note and retrieve_layers
    it('add_sticky_note and retrieve_layers should work correctly', () => {
      const testFunc = () => {};
      const layeredObject = {} as LayeredObject;
  
      add_sticky_note(testFunc, layeredObject);
      expect(retrieve_layers(testFunc)).toBe(layeredObject);
    });
  

  });


  // ... existing imports and test suites ...
describe('test multiple layers', () => {
  let obj: any;
  let obj2: any;
  let merge_proc: any;

  beforeEach(() => {
    obj = pipe(
      1,
      (x) => support_by(x, "support"),
      (x) => mark_error(x, "error"),
      (x) => annotate_time(x, 1000),
      (x) => mark_id(x),
      (x) => add_log(x, "log")
    );

    obj2 = pipe(
      2,
      (x) => support_by(x, "support2"),
      (x) => mark_error(x, "error2"),
      (x) => annotate_time(x, 2000),
      (x) => mark_id(x),
      (x) => add_log(x, "log2")
    );

    merge_proc = make_layered_procedure("merge_proc", 1, (a: any, b: any) => a + b);
  });

  it('should handle base layer correctly', () => {
    console.log(obj.describe_self())
    expect(get_base_value(obj)).toBe(1);
    expect(get_base_value(obj2)).toBe(2);
  });

  it('should handle support layer correctly', () => {
    expect(to_array(get_support_layer_value(obj))).toEqual(["support"]);
    expect(to_array(get_support_layer_value(obj2))).toEqual(["support2"]);
  });

  it('should handle error layer correctly', () => {
    expect(get_error_layer_value(obj)[0].get_error()).toBe("error");
    expect(get_error_layer_value(obj2)[0].get_error()).toBe("error2");
  });

  it('should handle time layer correctly', () => {
    expect(get_time_layer_value(obj).timestamp).toBe(1000);
    expect(get_time_layer_value(obj2).timestamp).toBe(2000);
  });

  it('should handle id layer correctly', () => {
    expect(get_length(get_id_layer_value(obj))).toBe(1);
    expect(get_length(get_id_layer_value(obj2))).toBe(1);
  });

  it('should handle log layer correctly', () => {
    expect(get_log_layer_value(obj)[0].get_message()).toBe("log");
    expect(get_log_layer_value(obj2)[0].get_message()).toBe("log2");
  });

  it('should merge layers correctly', () => {
    const result = merge_proc(obj, obj2);

    expect(get_base_value(result)).toBe(3);
    expect(to_array(get_support_layer_value(result)).sort()).toEqual(["support", "support2"]);
    expect(get_error_layer_value(result).map((e: any) => e.get_error())).toEqual(["error", "error2"]);
    expect(get_time_layer_value(result).timestamp).toBe(2000);
    expect(get_length(get_id_layer_value(result))).toBe(2);
    expect(get_log_layer_value(result).map((l: any) => l.get_message())).toEqual(["log", "log2"]);
  });
});