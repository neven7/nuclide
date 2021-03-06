/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

export function arrayRemove<T>(array: Array<T>, element: T): void {
  const index = array.indexOf(element);
  if (index >= 0) {
    array.splice(index, 1);
  }
}

export function arrayEqual<T>(
  array1: Array<T>,
  array2: Array<T>,
  equalComparator?: (a: T, b: T) => boolean,
): boolean {
  if (array1.length !== array2.length) {
    return false;
  }
  const equalFunction = equalComparator || ((a: T, b: T) => a === b);
  return array1.every((item1, i) => equalFunction(item1, array2[i]));
}

/**
 * Returns a copy of the input Array with all `null` and `undefined` values filtered out.
 * Allows Flow to typecheck the common `filter(x => x != null)` pattern.
 */
export function arrayCompact<T>(array: Array<?T>): Array<T> {
  const result = [];
  for (const elem of array) {
    if (elem != null) {
      result.push(elem);
    }
  }
  return result;
}

/**
 * Returns the last index in the input array that matches the predicate.
 * Returns -1 if no match is found.
 */
export function arrayFindLastIndex<T>(
  array: Array<T>,
  predicate: (elem: T, index: number, array: Array<T>) => boolean,
  thisArg?: any,
): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate.call(thisArg, array[i], i, array)) {
      return i;
    }
  }
  return -1;
}

/**
 * Merges a given arguments of maps into one Map, with the latest maps
 * overriding the values of the prior maps.
 */
export function mapUnion<T, X>(...maps: Array<Map<T, X>>): Map<T, X> {
  const unionMap = new Map();
  for (const map of maps) {
    for (const [key, value] of map) {
      unionMap.set(key, value);
    }
  }
  return unionMap;
}

export function mapFilter<T, X>(
  map: Map<T, X>,
  selector: (key: T, value: X) => boolean,
): Map<T, X> {
  const selected = new Map();
  for (const [key, value] of map) {
    if (selector(key, value)) {
      selected.set(key, value);
    }
  }
  return selected;
}

export function mapEqual<T, X>(
  map1: Map<T, X>,
  map2: Map<T, X>,
) {
  if (map1.size !== map2.size) {
    return false;
  }
  for (const [key1, value1] of map1) {
    if (map2.get(key1) !== value1) {
      return false;
    }
  }
  return true;
}

export function areSetsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size === b.size && every(a, element => b.has(element));
}

// Array.every but for any iterable.
export function every<T>(values: Iterable<T>, predicate: (element: T) => boolean): boolean {
  for (const element of values) {
    if (!predicate(element)) {
      return false;
    }
  }
  return true;
}

export function setIntersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set(Array.from(a).filter(e => b.has(e)));
}

export function setDifference<T>(a: Set<T>, b: Set<T>, hash_?: (v: T) => any): Set<T> {
  if (a.size === 0) {
    return new Set();
  } else if (b.size === 0) {
    return new Set(a);
  }
  const result = new Set();
  const hash = hash_ || (x => x);
  const bHashes = hash_ == null ? b : new Set(Array.from(b.values()).map(hash));
  a.forEach(value => {
    if (!bHashes.has(hash(value))) {
      result.add(value);
    }
  });
  return result;
}

/**
 * O(1)-check if a given object is empty (has no properties, inherited or not)
 */
export function isEmpty(obj: Object): boolean {
  for (const key in obj) {
    return false;
  }
  return true;
}

/**
 * Constructs an enumeration with keys equal to their value.
 * e.g. keyMirror({a: null, b: null}) => {a: 'a', b: 'b'}
 *
 * Based off the equivalent function in www.
 */
export function keyMirror<T: Object>(obj: T): {[key: $Enum<T>]: $Enum<T>} {
  const ret = {};
  Object.keys(obj).forEach(key => {
    ret[key] = key;
  });
  return ret;
}

/**
 * Given an array of [key, value] pairs, construct a map where the values for
 * each key are collected into an array of values, in order.
 */
export function collect<K, V>(pairs: Array<[K, V]>): Map<K, Array<V>> {
  const result = new Map();
  for (const pair of pairs) {
    const [k, v] = pair;
    let list = result.get(k);
    if (list == null) {
      list = [];
      result.set(k, list);
    }
    list.push(v);
  }
  return result;
}

export class MultiMap<K, V> {
  // Invariant: no empty sets. They should be removed instead.
  _map: Map<K, Set<V>>;

  // TODO may be worth defining a getter but no setter, to mimic Map. But please just behave and
  // don't mutate this from outside this class.
  //
  // Invariant: equal to the sum of the sizes of all the sets contained in this._map
  /* The total number of key-value bindings contained */
  size: number;

  constructor() {
    this._map = new Map();
    this.size = 0;
  }

  /*
   * Returns the set of values associated with the given key. Do not mutate the given set. Copy it
   * if you need to store it past the next operation on this MultiMap.
   */
  get(key: K): Set<V> {
    const set = this._map.get(key);
    if (set == null) {
      return new Set();
    }
    return set;
  }

  /*
   * Mimics the Map.prototype.set interface. Deliberately did not choose "set" as the name since the
   * implication is that it removes the previous binding.
   */
  add(key: K, value: V): MultiMap<K, V> {
    let set = this._map.get(key);
    if (set == null) {
      set = new Set();
      this._map.set(key, set);
    }
    if (!set.has(value)) {
      set.add(value);
      this.size++;
    }
    return this;
  }

  /*
   * Mimics the Map.prototype.set interface. Replaces the previous binding with new values.
   */
  set(key: K, values: Iterable<V>): void {
    this.deleteAll(key);
    const newSet = new Set(values);
    if (newSet.size !== 0) {
      this._map.set(key, newSet);
      this.size += newSet.size;
    }
  }

  /*
   * Deletes a single binding. Returns true iff the binding existed.
   */
  delete(key: K, value: V): boolean {
    const set = this.get(key);
    const didRemove = set.delete(value);
    if (set.size === 0) {
      this._map.delete(key);
    }
    if (didRemove) {
      this.size--;
    }
    return didRemove;
  }

  /*
   * Deletes all bindings associated with the given key. Returns true iff any bindings were deleted.
   */
  deleteAll(key: K): boolean {
    const set = this.get(key);
    this.size -= set.size;
    return this._map.delete(key);
  }

  clear(): void {
    this._map.clear();
    this.size = 0;
  }

  has(key: K, value: V): boolean {
    return this.get(key).has(value);
  }

  hasAny(key: K): boolean {
    return this._map.has(key);
  }

  *values(): Iterable<V> {
    for (const set of this._map.values()) {
      yield* set;
    }
  }

  forEach(callback: (value: V, key: K, obj: MultiMap<K, V>) => void): void {
    this._map.forEach((values, key) => values.forEach(value => callback(value, key, this)));
  }
}

export function objectEntries<T>(obj: {[key: string]: T}): Array<[string, T]> {
  if (obj == null) { throw new TypeError(); }
  const entries = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && Object.prototype.propertyIsEnumerable.call(obj, key)) {
      entries.push([key, obj[key]]);
    }
  }
  return entries;
}

export function objectFromMap<T>(map: Map<string, T>): {[key: string]: T} {
  const obj = {};
  map.forEach((v, k) => { obj[k] = v; });
  return obj;
}

export function *concatIterators<T>(...iterators: Array<Iterable<T>>): Iterator<T> {
  for (const iterator of iterators) {
    for (const element of iterator) {
      yield element;
    }
  }
}
