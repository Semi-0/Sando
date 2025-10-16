# Equality Functions Comprehensive Test Suite

## Overview
Comprehensive unit tests for all equality functions in the Sando layered architecture, with **45 tests all passing**.

## Test Results
✅ **45/45 tests passing**

## Equality Functions Tested

### 1. `layers_base_equal` (6 tests)
Tests equality of base values in layered objects.

**Coverage:**
- ✅ Primitive values (numbers, strings)
- ✅ Object base values (deep equality)
- ✅ Array base values
- ✅ Different primitive values return false
- ✅ Different object values return false

### 2. `layers_length_equal` (3 tests)
Tests equality of layer counts between layered objects.

**Coverage:**
- ✅ Same layer count returns true
- ✅ Different layer counts return false
- ✅ Single layer objects with same count

### 3. `all_layers_value_equal` (7 tests)
Tests equality of values across all layers in layered objects.

**Coverage:**
- ✅ Support layer values
- ✅ Multiple layers with all values equal
- ✅ Error layer values (ErrorPair objects)
- ✅ Different support values return false
- ✅ Different error messages return false
- ✅ One layer differing returns false

### 4. `layered_deep_equal` (26 tests)
Complete deep equality check including base value, layer count, and all layer values.

**Basic Cases (6 tests):**
- ✅ Identical simple layered objects
- ✅ Different base values return false
- ✅ Different layer values return false
- ✅ String, object, and array base values

**Multiple Layers (4 tests):**
- ✅ Support + Time layers
- ✅ Three layer objects (Support + Time + Error)
- ✅ Different time values return false
- ✅ Missing layers return false

**Multiple Support Values (3 tests):**
- ✅ Multiple support values
- ✅ Different number of support values return false
- ✅ Order-independent support set comparison

**Error Cases (3 tests):**
- ✅ Error layer values (ErrorPair objects)
- ✅ Different error messages return false
- ✅ Compound values with errors and support

**Complex Nested Cases (3 tests):**
- ✅ Nested objects deep equality
- ✅ Different nested objects return false
- ✅ Mixed nested structures (objects + arrays)

**Edge Cases (8 tests):**
- ✅ Null and undefined base values
- ✅ Boolean values (true/false distinction)
- ✅ Zero vs non-zero numbers
- ✅ Empty arrays and objects
- ✅ All negative cases return false correctly

### 5. `is_equal` for BetterSets (3 tests)
Tests the generic `is_equal` implementation for support layer sets.

**Coverage:**
- ✅ Sets with same elements are equal
- ✅ Order-independent comparison
- ✅ Different sets return false

## Key Fixes Applied

### 1. Object Equality Handler
Added handler in `generic_arithmetic.ts` to properly compare plain objects:
```typescript
define_generic_procedure_handler(is_equal,
    all_match(is_object),
    (a: any, b: any) => {
        // Deep equality check with proper property iteration
        const aKeys = Object.keys(a).sort()
        const bKeys = Object.keys(b).sort()
        // ... compare keys and values recursively
    }
)
```

### 2. ErrorPair Object Comparison
Special handling for bundled ErrorPair objects in the object equality handler:
```typescript
if (a.identifier === "error_pair" && b.identifier === "error_pair") {
    return is_equal(a.get_error(), b.get_error()) && 
           is_equal(a.get_value(), b.get_value())
}
```

### 3. Layered Deep Equal Integration
Handler registered in `Equality.ts` for complete layered object comparison:
```typescript
define_generic_procedure_handler(is_equal, all_match(is_layered_object), layered_deep_equal)
```

## Architecture

The equality system is hierarchical:

1. **Base Equality** (`is_equal` in generic_arithmetic.ts)
   - Primitives: === comparison
   - Arrays: element-by-element recursion
   - Objects: property-by-property recursion
   - ErrorPair: get_error() and get_value() comparison
   - BetterSets: element membership checking

2. **Layer Equality**
   - `layers_base_equal`: Extracts and compares base values
   - `layers_length_equal`: Compares layer counts
   - `all_layers_value_equal`: Compares each layer's value

3. **Deep Layered Equality** (`layered_deep_equal`)
   - Combines all three layer equality checks
   - Ensures complete object equivalence

## Usage in GenericValueSet

The `layered_deep_equal` function is critical for `GenericValueSet` operations:
- **`drop()`**: Uses `layered_deep_equal` via `some()` to find and remove elements
- **`find_related_elements()`**: Identifies elements with same base value
- **`subsumes()`**: Determines if one element is more informative than another

## Test File Location
`/Users/linpandi/Dropbox/Programs/Sando/Test/equality.test.ts`

## Running Tests
```bash
cd /Users/linpandi/Dropbox/Programs/Sando
bun test Test/equality.test.ts
```

## Impact

These tests validate:
1. ✅ Deep equality for layered objects works correctly
2. ✅ All layer types (Support, Time, Error) compare properly
3. ✅ Nested and complex structures are handled
4. ✅ Edge cases (null, undefined, empty structures) work
5. ✅ Bundled objects (ErrorPair) compare by value, not reference
6. ✅ Sets compare by element membership, not reference
7. ✅ The equality functions are ready for use in GenericValueSet merge logic

