// Test object keys in Map
const map = new Map();

// Create two objects with same properties
const obj1 = { id: 1, name: "test" };
const obj2 = { id: 1, name: "test" };

// Add them to map
map.set(obj1, "value1");
map.set(obj2, "value2");

console.log("Map size:", map.size); // Will be 2 because obj1 and obj2 are different objects
console.log("Has obj1:", map.has(obj1)); // true
console.log("Has obj2:", map.has(obj2)); // true
console.log("Has new object with same properties:", map.has({ id: 1, name: "test" })); // false

// Using same object reference
const obj3 = obj1;
map.set(obj3, "value3");
console.log("Map size after using same reference:", map.size); // Still 2 because obj3 is same as obj1
console.log("Value for obj1:", map.get(obj1)); // "value3"
console.log("Value for obj3:", map.get(obj3)); // "value3" 