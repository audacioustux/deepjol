import * as R from "jsr:@rambda/rambda@9.4.2";

/* ======================================================================
   Configuration Types
   ====================================================================== */

interface ObjectDiffConfigOptions<T extends object> {
  ignore_keys?: (keyof T)[];
  omit_unchanged_entries?: boolean;
  // New: when true, keys that were removed are not reported.
  ignore_missing?: boolean;
}

interface ArrayDiffConfigOptions {
  ignore_indexes?: number[];
  omit_unchanged_elements?: boolean;
  // For consistency, allow ignore_missing here as well.
  ignore_missing?: boolean;
}

interface ArrayOfObjectsDiffConfigOptions<T extends Array<unknown>> {
  unique_by?: keyof T[number];
  ignore_keys?: (keyof T[number])[];
  omit_unchanged_elements?: boolean;
  ignore_missing?: boolean;
}

type DiffConfigOptionsDefault = {
  default?: {
    omit_unchanged_entries?: boolean;
    omit_unchanged_elements?: boolean;
    ignore_missing?: boolean;
  };
};

type DiffConfigOptions<T> = T extends Array<infer U>
  ? U extends object ? ArrayOfObjectsDiffConfigOptions<T>
  : ArrayDiffConfigOptions
  : T extends object ? ObjectDiffConfigOptions<T>
  : never;

/* ======================================================================
   DiffResult Type
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
 * Returns true if val is a plain object (not null and not an array).
 */
function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

/**
 * Returns true if val is an object (and not null).
 */
function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object";
}

/* ======================================================================
   Diff Functions
   ====================================================================== */

/**
 * deepDiff compares two values recursively and returns an object
 * representing the differences. When diffValue returns undefined
 * (i.e. no differences), an empty object is returned.
 *
 * The configuration object can specify per‑key options.
 */
export function deepDiff<T = unknown>(
  left: T,
  right: T,
  config: Record<string, unknown> & DiffConfigOptionsDefault = {},
): DiffResult<T> {
  const diff = diffValue(left, right, config);
  return (diff === undefined ? {} : diff) as DiffResult<T>;
}

/**
 * diffValue dispatches to diffArray or diffObject based on the types
 * of left and right.
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
  // For primitives or differing types, return right if not equal.
  return R.equals(left, right) ? undefined : right;
}

/**
 * diffObject compares two plain objects.
 *
 * It extracts configuration options (including ignore_missing) and merges
 * a parent's default config with any child-specific config.
 */
function diffObject(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  config: Record<string, unknown> = {},
): Record<string, unknown> | undefined {
  // Ensure config is an object.
  const conf: Record<string, unknown> = isObject(config) ? config : {};

  // Extract options from conf.
  const ignore_keys: string[] = Array.isArray(conf.ignore_keys)
    ? conf.ignore_keys.filter((k): k is string => typeof k === "string")
    : [];
  const omit_unchanged_entries: boolean =
    typeof conf.omit_unchanged_entries === "boolean"
      ? conf.omit_unchanged_entries
      : true;
  // Note: baseIgnoreMissing applies for keys that do not have their own setting.
  const baseIgnoreMissing: boolean = typeof conf.ignore_missing === "boolean"
    ? conf.ignore_missing
    : false;
  const defaultConfig: Record<string, unknown> =
    conf.default && isObject(conf.default) ? conf.default : {};

  // Child-specific configurations (for keys) are any properties in conf
  // other than the ones extracted above.
  const {
    ignore_keys: _ignored,
    omit_unchanged_entries: _omit,
    default: _def,
    ignore_missing: _im,
    ...childConfigs
  } = conf;

  // Get the union of keys in left and right.
  const keys = new Set<string>([...Object.keys(left), ...Object.keys(right)]);
  const result: Record<string, unknown> = {};
  let hasDiff = false;

  for (const key of keys) {
    if (ignore_keys.includes(key)) continue;

    // For each key, merge parent's default with any child-specific config.
    const childSpecific: Record<string, unknown> =
      key in childConfigs && isObject(childConfigs[key])
        ? (childConfigs[key] as Record<string, unknown>)
        : {};
    const childConfig = { ...defaultConfig, ...childSpecific };

    // Determine effective ignore_missing for this key.
    const effectiveIgnoreMissing =
      typeof childConfig.ignore_missing === "boolean"
        ? childConfig.ignore_missing
        : baseIgnoreMissing;

    // If the key was removed (present in left but not in right)…
    if (key in left && !(key in right)) {
      if (!effectiveIgnoreMissing) {
        result[key] = undefined;
        hasDiff = true;
      }
      continue;
    }
    // If the key was added (present in right but not in left)…
    if (!(key in left) && key in right) {
      result[key] = right[key];
      hasDiff = true;
      continue;
    }
    // Otherwise, diff the two values.
    const diff = diffValue(left[key], right[key], childConfig);
    if (diff !== undefined) {
      result[key] = diff;
      if (!R.equals(diff, right[key])) {
        hasDiff = true;
      }
    } else if (!omit_unchanged_entries) {
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
 * When no unique key is provided (config.unique_by), the arrays are compared
 * as a whole. When config.unique_by is provided, each element is matched by that key
 * and diffed individually.
 */
function diffArray(
  left: unknown[],
  right: unknown[],
  config: Record<string, unknown> = {},
): unknown {
  const conf: Record<string, unknown> = isObject(config) ? config : {};
  // If no unique_by is provided, compare arrays as a whole.
  if (!("unique_by" in conf)) {
    return R.equals(left, right) ? undefined : right;
  }
  const uniqueBy = conf.unique_by;
  if (typeof uniqueBy !== "string" && typeof uniqueBy !== "number") {
    throw new Error("unique_by must be a string or number");
  }
  const omitUnchangedElements: boolean =
    typeof conf.omit_unchanged_elements === "boolean"
      ? conf.omit_unchanged_elements
      : true;
  const defaultConfig: Record<string, unknown> =
    conf.default && isObject(conf.default) ? conf.default : {};

  // Build configuration for diffing each array element.
  const elemConfig = {
    ...defaultConfig,
    ignore_keys: Array.isArray(conf.ignore_keys) ? conf.ignore_keys : [],
    omit_unchanged_entries: typeof conf.omit_unchanged_entries === "boolean"
      ? conf.omit_unchanged_entries
      : true,
    ignore_missing: typeof conf.ignore_missing === "boolean"
      ? conf.ignore_missing
      : false,
  };

  // Map left-array elements by the unique key.
  const leftMap = new Map<unknown, unknown>();
  for (const item of left) {
    if (item && isObject(item) && uniqueBy in item) {
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
      // No differences; include element only if configured.
      if (!omitUnchangedElements) {
        resultArr.push(rightElem);
      }
    } else {
      // When diffing an element, if the diff is an object and does not include the unique key,
      // force-add it.
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
