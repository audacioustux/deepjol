# Deepjol

![publish](https://github.com/audacioustux/deepjol/actions/workflows/publish.yml/badge.svg)

Deepjol is a powerful utility library for deep diffing JavaScript objects, enabling you to detect changes, additions, and deletions across complex nested structures and arrays. It offers flexible configuration options to control the output format, making it ideal for applications like state synchronization, patch generation, and audit logging.

## Installation

```bash
# Using npm
npm install @audacioustux/deepjol
```

## Usage

### Basic Example

```typescript
import * as deepjol from "@audacioustux/deepjol";

const oldObj = { a: 1, b: { c: 2 } };
const newObj = { a: 2, b: { c: 2, d: 3 } };

const diff = deepjol.deepDiff(oldObj, newObj);
// Returns: { a: 2, b: { d: 3 } }
```

## Features

- 🕵️ Deep comparison of nested objects and arrays
- 🔍 Detects value changes, added entries, and removed entries
- ⚙️ Configurable output formatting:
  - Omit unchanged fields/elements
  - Ignore specific keys
  - Handle arrays using unique identifiers
- 🧩 Supports complex structures with mixed object/array nesting
- 🚀 Deno-first implementation

## Configuration Options

| Option                     | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| `omit_unchanged_entries`   | Omit unchanged properties in objects (default: `true`)                     |
| `omit_unchanged_elements`  | Omit unchanged items in arrays when using `unique_by` (default: `true`)    |
| `ignore_keys`              | Array of keys to exclude from comparison                                   |
| `unique_by`                | Key to use for matching array elements (enables smart array diffing)      |

_Options can be applied globally, per-object-property, or inherited from `default` config._

## Examples

### Flat Object Changes

```typescript
deepjol.deepDiff({ a: 1 }, { a: 2 });
// { a: 2 }

deepjol.deepDiff({ a: 1 }, { a: 1, b: 2 });
// { b: 2 }

deepjol.deepDiff({ a: 1, b: 2 }, { a: 1 });
// { b: undefined }
```

### Array Diffing

```typescript
// Smart array matching with unique IDs
deepjol.deepDiff(
  { users: [{ id: 1, name: "Alice" }] },
  { users: [{ id: 1, name: "Alison" }] },
  { users: { unique_by: "id" } }
);
// { users: [{ id: 1, name: "Alison" }] }
```

### Advanced Configuration

```typescript
const result = deepjol.deepDiff(
  {
    products: [
      { id: 1, name: "Widget", stock: 10 },
      { id: 2, name: "Gadget", stock: 5 }
    ]
  },
  {
    products: [
      { id: 1, name: "Widget", stock: 8 },
      { id: 2, name: "Gadget Pro", stock: 5 }
    ]
  },
  {
    products: {
      unique_by: "id",
      omit_unchanged_entries: true,
      ignore_keys: ["stock"]
    }
  }
);

// Returns:
// {
//   products: [
//     { id: 2, name: "Gadget Pro" }
//   ]
// }
```

## Contributing

Contributions are welcome! Please ensure all tests pass:

```bash
deno test
```

## License

MIT License

[//]: # (The rest of the README remains unchanged with all examples updated to use deepjol.* syntax)
