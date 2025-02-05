// deno-lint-ignore-file no-explicit-any
import * as R from "jsr:@rambda/rambda@9.4.2";

//
// Configuration types
//
interface BaseDiffConfigOptions {
  omit_unchanged_elements?: boolean;
  omit_unchanged_keys?: boolean;
}

interface ObjectDiffConfigOptions<T extends object> {
  ignore_keys?: (keyof T)[];
}

interface ArrayDiffConfigOptions {
  ignore_indexes?: boolean;
}

interface ArrayOfObjectsDiffConfigOptions<T extends Array<any>> {
  unique_by?: keyof T[number];
  ignore_keys?: (keyof T[number])[];
}

type DiffConfigOptions<T> = T extends any[] ? T[number] extends object ?
      & BaseDiffConfigOptions
      & ArrayDiffConfigOptions
      & ArrayOfObjectsDiffConfigOptions<T>
  : BaseDiffConfigOptions & ArrayDiffConfigOptions
  : T extends object ? BaseDiffConfigOptions & ObjectDiffConfigOptions<T>
  : BaseDiffConfigOptions;

/**
 * deepDiff compares two values recursively and returns an object
 * representing the differences. When a key is “removed” in the right value,
 * its diff is set to undefined.
 *
 * The third parameter is an object that may contain configuration options
 * for individual keys. (Only keys that are present in the config object are
 * overridden; other keys use the default options.)
 */
export function deepDiff(
  left: any,
  right: any,
  config: Record<string, DiffConfigOptions<any>> = {},
): any {
  const diff = diffValue(left, right, config);
  return diff === undefined ? {} : diff;
}

/**
 * diffValue compares two values. Depending on the type it delegates
 * to diffObject or diffArray. The config parameter is passed along.
 */
function diffValue(
  left: any,
  right: any,
  config: Record<string, any> = {},
): any {
  if (Array.isArray(left) && Array.isArray(right)) {
    return diffArray(left, right, config);
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    return diffObject(left, right, config);
  }
  // If types differ or primitives are unequal, return right.
  return R.equals(left, right) ? undefined : right;
}

/**
 * diffObject compares two plain objects.
 *
 * The config parameter may include:
 *   - ignore_keys: an array of keys to skip at this level.
 *   - omit_unchanged_keys: if true (the default) then keys that didn’t change are omitted.
 *
 * In addition, any extra properties in config (by key name) are treated as
 * configuration for that child property.
 */
function diffObject(
  left: Record<string, any>,
  right: Record<string, any>,
  config: Record<string, any> = {},
): any {
  // Separate local options from child-specific options.
  const {
    ignore_keys = [] as string[],
    omit_unchanged_keys = true,
    ...childConfigs
  } = config;
  const keys = new Set<string>([
    ...Object.keys(left || {}),
    ...Object.keys(right || {}),
  ]);
  const result: Record<string, any> = {};
  for (const key of keys) {
    if (ignore_keys.includes(key)) continue;

    // Use child config for this key if provided; otherwise use {}.
    const childConfig = childConfigs[key] || {};

    // Key removed?
    if (key in left && !(key in right)) {
      result[key] = undefined;
      continue;
    }
    // Key added?
    if (!(key in left) && key in right) {
      result[key] = right[key];
      continue;
    }
    // Otherwise, diff the values.
    const diff = diffValue(left[key], right[key], childConfig);
    if (diff !== undefined) {
      result[key] = diff;
    } else if (!omit_unchanged_keys) {
      // Include unchanged keys if so configured.
      result[key] = right[key];
    }
  }
  return Object.keys(result).length === 0 ? undefined : result;
}

/**
 * diffArray compares two arrays.
 *
 * Without a unique key (config.unique_by) the arrays are compared “as a whole”
 * (using R.equals) and if they differ then the right array is returned.
 *
 * When config.unique_by is provided, it is assumed that both arrays hold objects
 * with that unique key. Then each element is matched by that key and diffed.
 *
 * Additional options for arrays-of-objects:
 *   - ignore_keys: passed to the diffing of each element.
 *   - omit_unchanged_elements: if true then elements with no diff are omitted.
 *   - omit_unchanged_keys: passed to diffing of object elements.
 */
function diffArray(
  left: any[],
  right: any[],
  config: any = {},
): any {
  // No special unique key? Simply compare the arrays.
  if (!("unique_by" in config)) {
    return R.equals(left, right) ? undefined : right;
  }
  const uniqueBy = config.unique_by;
  // Default to omitting unchanged elements unless explicitly disabled.
  const omitUnchangedElements = config.omit_unchanged_elements !== false;

  // Build a config for diffing each element.
  const elemConfig = {
    ignore_keys: config.ignore_keys || [],
    // When diffing an element, if not explicitly overridden, default to omit unchanged keys.
    omit_unchanged_keys: config.omit_unchanged_keys === false ? false : true,
  };

  // Map left array elements by their unique key.
  const leftMap = new Map<any, any>();
  for (const item of left) {
    if (item && item[uniqueBy] !== undefined) {
      leftMap.set(item[uniqueBy], item);
    }
  }
  const resultArr: any[] = [];
  for (const rightElem of right) {
    const key = rightElem ? rightElem[uniqueBy] : undefined;
    const leftElem = key !== undefined ? leftMap.get(key) : undefined;
    let diff = diffValue(leftElem, rightElem, elemConfig);
    if (diff === undefined) {
      // No differences.
      if (!omitUnchangedElements) {
        // In this “non-diff” case, include the full right element.
        resultArr.push(rightElem);
      }
    } else {
      // When diffing an element, if the diff is an object and does not contain the unique key,
      // force-add the unique key from the right element.
      if (
        diff &&
        typeof diff === "object" &&
        !Array.isArray(diff) &&
        diff[uniqueBy] === undefined
      ) {
        diff = { ...diff, [uniqueBy]: rightElem[uniqueBy] };
      }
      resultArr.push(diff);
    }
  }
  return resultArr.length === 0 ? undefined : resultArr;
}

/**
 * Helper: returns true if val is a plain object (and not null or an array)
 */
function isPlainObject(val: any): val is object {
  return (
    val !== null &&
    typeof val === "object" &&
    !Array.isArray(val)
  );
}
