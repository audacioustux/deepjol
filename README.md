# Deepjol

Deepjol is a TypeScript library for computing deep differences between objects and arrays. It allows you to detect added, removed, and modified values while supporting advanced options such as ignoring specific keys, omitting unchanged elements, and handling nested structures efficiently.

## Installation

```sh
deno add deepjol
```

## Usage

```ts
import * as deepjol from "jsr:@audacioustux/deepjol";
```

## Features

- Detects changes in flat and nested objects
- Handles additions, removals, and modifications
- Supports deep comparison for arrays, including unique key handling
- Allows ignoring specific keys
- Optionally omits unchanged keys and elements

## API

### `deepDiff(left: object, right: object, options?: object): object`

Computes the difference between `left` and `right` objects.

#### Parameters

- `left`: The original object
- `right`: The updated object
- `options` (optional): An object specifying advanced behavior

### Examples

#### Detecting a changed value in a flat object

```ts
deepDiff({ a: 1 }, { a: 2 });
// Output: { a: 2 }
```

#### Detecting an added entry in a flat object

```ts
deepDiff({ a: 1 }, { a: 1, b: 2 });
// Output: { b: 2 }
```

#### Detecting a removed entry in a flat object

```ts
deepDiff({ a: 1, b: 2 }, { a: 1 });
// Output: { b: undefined }
```

#### Detecting a changed value in a nested object

```ts
deepDiff({ a: { b: 1 } }, { a: { b: 2 } });
// Output: { a: { b: 2 } }
```

#### Ignoring specified keys in nested objects

```ts
deepDiff(
  { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } },
  { a: { b: 2, c: 2 }, d: { e: 3, f: 5 } },
  { a: { ignore_keys: ["b"] } }
);
// Output: { d: { f: 5 } }
```

#### Detecting changes in arrays

```ts
deepDiff({ a: [1, 2, 3] }, { a: [1, 3, 2] });
// Output: { a: [1, 3, 2] }
```

#### Handling unique keys in arrays

```ts
deepDiff(
  { a: [{ id: 1, val: "foo" }] },
  { a: [{ id: 1, val: "baz" }] },
  { a: { unique_by: "id" } }
);
// Output: { a: [{ id: 1, val: "baz" }] }
```

## License

MIT
