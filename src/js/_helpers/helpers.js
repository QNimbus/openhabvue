/**
 * TODO: Summary. (use period)
 *
 * TODO: Description. (use period)
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/storage/index.js
 * @file   This files defines the MyClass class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

// External imports
import { defaultsDeep } from 'lodash-es';
import { FetchException, CustomException } from './customExceptions';

const FETCH_TIMEOUT = 5000;

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

/**
 *
 *
 * @export
 * @param {*} array
 * @param {*} key
 * @param {*} objectKey
 */
export function extractFromArray(array, key, objectKey) {
  const items = arrayToObject(array, key);
  return items[objectKey] ? items[objectKey] : {};
}

/**
 *
 *
 * @export
 * @param {*} url
 * @returns
 */
export async function customFetch(url, init) {
  const controller = new AbortController();
  const headers = new Headers({ 'content-type': 'application/json' });

  init = defaultsDeep(init, {
    method: 'GET',
    mode: 'cors',
    headers: headers,
    signal: controller.signal,
    validateHttpsCertificates: false,
    muteHttpExceptions: true,
    timeout: FETCH_TIMEOUT,
  });

  setTimeout(() => {
    controller.abort();
  }, init.timeout);

  const response = await fetch(url, init).catch(error => {
    let customError;
    switch (error.constructor) {
      case DOMException: {
        customError = new CustomException(`Timeout after ${init.timeout / 1000}s`);
        break;
      }
      case TypeError: {
        customError = new FetchException(`Failed to fetch`, error);
        break;
      }
      default: {
        customError = error;
        break;
      }
    }
    throw customError;
  });

  if (!response.ok) {
    throw new FetchException(response.statusText, response.status);
  }

  return response;
}
