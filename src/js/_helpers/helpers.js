/**
 * Helper function to check if an object is iterable
 *
 * e.g. if you can loop through it using for...in, for...of, forEach, etc
 *
 * @export
 * @param {*} obj
 * @returns
 */
export function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}

/**
 * Helper function to convert an array of objects to an object with objects
 *
 * e.g. const peopleArray = [
  { id: 123, name: "dave", age: 23 },
  { id: 456, name: "chris", age: 23 },
  { id: 789, name: "bob", age: 23 },
  { id: 101, name: "tom", age: 23 },
  { id: 102, name: "tim", age: 23 }

  to ==>

  const peopleObject = {
  "123": { id: 123, name: "dave", age: 23 },
  "456": { id: 456, name: "chris", age: 23 },
  "789": { id: 789, name: "bob", age: 23 },
  "101": { id: 101, name: "tom", age: 23 },
  "102": { id: 102, name: "tim", age: 23 }
}
]
 *
 * @export
 * @param {*} array
 * @param {*} keyField
 */
export function arrayToObject(array, keyField) {
  return array.reduce((obj, item) => {
    obj[item[keyField]] = item;
    return obj;
  }, {});
}
