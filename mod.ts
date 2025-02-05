import * as R from "jsr:@rambda/rambda@9.4.2";

/* ======================================================================
   Configuration Types
   ====================================================================== */

interface ObjectDiffConfigOptions<T extends object> {
  ignore_keys?: (keyof T)[];
  omit_unchanged_entries?: boolean;
}

interface ArrayDiffConfigOptions {
  ignore_indexes?: number[];
  omit_unchanged_elements?: boolean;
}

interface ArrayOfObjectsDiffConfigOptions<T extends Array<any>> {
  unique_by?: keyof T[number];
  ignore_keys?: (keyof T[number])[];
  omit_unchanged_elements?: boolean;
}

type DiffConfigOptionsDefault = {
  default?: {
    omit_unchanged_entries?: boolean;
    omit_unchanged_elements?: boolean;
  };
};

type DiffConfigOptions<T> = T extends Array<infer U>
  ? U extends object ? ArrayOfObjectsDiffConfigOptions<T>
  : ArrayDiffConfigOptions
  : T extends object ? ObjectDiffConfigOptions<T>
  : never;

/* ======================================================================
   DiffResult type
   ====================================================================== */

/**
 * DiffResult is a recursive type that “mirrors” the shape of the input type.
 */
export type DiffResult<T = unknown> = T extends Array<infer U>
  ? U extends object ? Array<DiffResult<U>>
  : T
  : T extends object ? Partial<{ [K in keyof T]: DiffResult<T[K]> }>
  : T;

/* ======================================================================
   Helper Functions
   ====================================================================== */

/**
 * isPlainObject checks that a value is a non-null object that isn’t an array.
 */
function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

/**
 * isObject ensures the value is an object (and not null).
 */
function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object";
}

/* ======================================================================
   deepDiff and Helper Functions
   ====================================================================== */

/**
 * deepDiff compares two values recursively and returns an object
 * representing the differences.
 *
 * When diffValue returns undefined (i.e. no differences), an empty object
 * is returned.
 */
export function deepDiff<T = unknown>(
  left: T,
  right: T,
  config: Record<string, unknown> = {},
): DiffResult<T> {
  const diff = diffValue(left, right, config);
  return (diff === undefined ? {} : diff) as DiffResult<T>;
}

/**
 * diffValue dispatches between diffArray and diffObject.
 */
function diffValue(
  left: unknown,
  right: unknown,
  config: Record<string, unknown>,
): unknown {
  if (Array.isArray(left) && Array.isArray(right)) {
    return diffArray(left, right, config);
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    return diffObject(left, right, config);
  }
  // For primitives or mismatched types, return right if unequal.
  return R.equals(left, right) ? undefined : right;
}

/**
 * diffObject compares two plain objects.
 *
 * It extracts configuration options only after checking that config values are
 * of the expected types.
 */
function diffObject(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  config: Record<string, unknown>,
): Record<string, unknown> | undefined {
  // Ensure config is an object.
  const conf: Record<string, unknown> = isObject(config) ? config : {};

  // Safely extract known options.
  const ignore_keys: string[] = Array.isArray(conf.ignore_keys)
    ? conf.ignore_keys.filter((k): k is string => typeof k === "string")
    : [];
  const omit_unchanged_entries: boolean =
    typeof conf.omit_unchanged_entries === "boolean"
      ? conf.omit_unchanged_entries
      : true;
  const defaultConfig: Record<string, unknown> =
    conf.default && isObject(conf.default) ? conf.default : {};

  // Use object rest to grab any child-specific configuration.
  const {
    ignore_keys: _ignored,
    omit_unchanged_entries: _omit,
    default: _def,
    ...childConfigs
  } = conf;

  const keys = new Set<string>([
    ...Object.keys(left),
    ...Object.keys(right),
  ]);
  const result: Record<string, unknown> = {};
  let hasDiff = false;

  for (const key of keys) {
    if (ignore_keys.includes(key)) continue;

    // For the key's config, ensure we have an object.
    const childSpecific: Record<string, unknown> =
      key in childConfigs && isObject(childConfigs[key])
        ? childConfigs[key] as Record<string, unknown>
        : {};
    // Merge the parent's default config with any child-specific config.
    const childConfig = { ...defaultConfig, ...childSpecific };

    // Key removed?
    if (key in left && !(key in right)) {
      result[key] = undefined;
      hasDiff = true;
      continue;
    }
    // Key added?
    if (!(key in left) && key in right) {
      result[key] = right[key];
      hasDiff = true;
      continue;
    }
    // Otherwise, diff the values.
    const diff = diffValue(left[key], right[key], childConfig);
    if (diff !== undefined) {
      result[key] = diff;
      // Mark that a diff occurred if the computed diff is not equivalent.
      if (!R.equals(diff, right[key])) {
        hasDiff = true;
      }
    } else if (!omit_unchanged_entries) {
      // If unchanged entries should be preserved.
      result[key] = right[key];
    }
  }
  if (!hasDiff && R.equals(left, right)) {
    return undefined;
  }
  return Object.keys(result).length === 0 ? undefined : result;
}

/**
 * diffArray compares two arrays.
 *
 * If no unique key is provided in config, the arrays are compared as a whole.
 * When config.unique_by is provided, each element is matched by that key.
 */
function diffArray(
  left: unknown[],
  right: unknown[],
  config: Record<string, unknown>,
): unknown {
  const conf: Record<string, unknown> = isObject(config) ? config : {};
  // If no unique_by key is provided, do a whole-array diff.
  if (!("unique_by" in conf)) {
    return R.equals(left, right) ? undefined : right;
  }
  const uniqueBy = conf.unique_by;
  // Ensure uniqueBy is a string or number.
  if (typeof uniqueBy !== "string" && typeof uniqueBy !== "number") {
    throw new Error("unique_by must be a string or number");
  }
  const omitUnchangedElements: boolean =
    typeof conf.omit_unchanged_elements === "boolean"
      ? conf.omit_unchanged_elements
      : true;
  const defaultConfig: Record<string, unknown> =
    conf.default && isObject(conf.default) ? conf.default : {};

  const elemConfig = {
    ...defaultConfig,
    ignore_keys: Array.isArray(conf.ignore_keys) ? conf.ignore_keys : [],
    omit_unchanged_entries: typeof conf.omit_unchanged_entries === "boolean"
      ? conf.omit_unchanged_entries
      : true,
  };

  // Build a Map from left-array elements keyed by uniqueBy.
  const leftMap = new Map<unknown, unknown>();
  for (const item of left) {
    if (item && isObject(item) && uniqueBy in item) {
      // Here we assume the unique key can be coerced to string.
      leftMap.set(item[uniqueBy as string], item);
    }
  }
  const resultArr: unknown[] = [];
  for (const rightElem of right) {
    let key: unknown;
    if (rightElem && isObject(rightElem)) {
      key = rightElem[uniqueBy as string];
    }
    const leftElem = key !== undefined ? leftMap.get(key) : undefined;
    let diff = diffValue(leftElem, rightElem, elemConfig);
    if (diff === undefined) {
      if (!omitUnchangedElements) {
        resultArr.push(rightElem);
      }
    } else {
      // If diff is an object and does not include the unique key, force-add it.
      if (
        diff &&
        isObject(diff) &&
        !Array.isArray(diff) &&
        diff[uniqueBy as string] === undefined &&
        rightElem &&
        isObject(rightElem)
      ) {
        diff = {
          ...(diff as Record<string, unknown>),
          [uniqueBy as string]: rightElem[uniqueBy as string],
        };
      }
      resultArr.push(diff);
    }
  }
  return resultArr.length === 0 ? undefined : resultArr;
}
