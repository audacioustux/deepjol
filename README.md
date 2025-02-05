# @audacioustux/deepjol

![publish](https://github.com/audacioustux/deepjol/actions/workflows/publish.yml/badge.svg)

`@audacioustux/deepjol` is a powerful library for performing deep differences between two objects or arrays. It is designed to handle complex nested structures, arrays, and objects with customizable options to control the behavior of the diffing process. This library is particularly useful for applications that need to detect changes in deeply nested data structures, such as state management, data synchronization, or testing.

## Features

- **Deep Diffing**: Detects changes in deeply nested objects and arrays.
- **Customizable Options**: Control the behavior of the diffing process with options like `omit_unchanged_entries`, `ignore_keys`, and `unique_by`.
- **Array Handling**: Supports detecting changes in arrays, including additions, removals, and modifications of elements.
- **Unique Key Matching**: Allows matching array elements by a unique key, making it easier to track changes in arrays of objects.
- **Flexible Configuration**: Configure options globally or on a per-property basis.

## Installation

You can install `@audacioustux/deepjol` using `deno`:

```bash
deno add @audacioustux/deepjol
```

Or you can import it directly in your code:

```typescript
import { deepDiff } from "@audacioustux/deepjol";
```

## Usage

### Basic Usage

```typescript
import { deepDiff } from "@audacioustux/deepjol";

const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { a: 1, b: { c: 3 } };

const result = deepDiff(obj1, obj2);
console.log(result); // { b: { c: 3 } }
```

### Advanced Usage with Options

```typescript
import { deepDiff } from "@audacioustux/deepjol";

const obj1 = { a: 1, b: { c: 2, d: 4 } };
const obj2 = { a: 1, b: { c: 3, d: 4 } };

const result = deepDiff(obj1, obj2, { b: { omit_unchanged_entries: true } });
console.log(result); // { b: { c: 3 } }
```

### Array Handling with Unique Key

```typescript
import { deepDiff } from "@audacioustux/deepjol";

const arr1 = { users: [{ id: 1, name: "Alice" }] };
const arr2 = { users: [{ id: 1, name: "Alison" }] };

const result = deepDiff(arr1, arr2, { users: { unique_by: "id" } });
console.log(result); // { users: [{ id: 1, name: "Alison" }] }
```

## API

### `deepDiff(left, right, options?)`

- **`left`**: The original object or array.
- **`right`**: The object or array to compare against.
- **`options`**: Optional configuration object to control the diffing behavior.

#### Options

- **`omit_unchanged_entries`**: If `true`, unchanged entries in objects will be omitted from the result. Default is `true`.
- **`ignore_keys`**: An array of keys to ignore during the diffing process.
- **`unique_by`**: A key to uniquely identify elements in an array. This is useful for tracking changes in arrays of objects.
- **`omit_unchanged_elements`**: If `true`, unchanged elements in arrays will be omitted from the result. Default is `false`.

## Examples

### Detecting Changes in Nested Objects

```typescript
const result = deepDiff(
  { a: { b: 1, c: 2 } },
  { a: { b: 2, c: 2 } },
  { a: { omit_unchanged_entries: true } }
);
// Result: { a: { b: 2 } }
```

### Detecting Changes in Arrays with Unique Key

```typescript
const result = deepDiff(
  { users: [{ id: 1, name: "Alice" }] },
  { users: [{ id: 1, name: "Alison" }] },
  { users: { unique_by: "id" } }
);
// Result: { users: [{ id: 1, name: "Alison" }] }
```

### Ignoring Specific Keys

```typescript
const result = deepDiff(
  { a: { b: 1, c: 2 } },
  { a: { b: 2, c: 3 } },
  { a: { ignore_keys: ["c"] } }
);
// Result: { a: { b: 2 } }
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or bug fixes.

## License

MIT
