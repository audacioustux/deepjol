import { assertEquals } from "jsr:@std/assert";
import { deepDiff } from "./mod.ts";

Deno.test("deepDiff should detect a changed value in a flat object", () => {
  const result = deepDiff({ a: 1 }, { a: 2 });
  assertEquals(result, { a: 2 });
});

Deno.test("deepDiff should detect an added entry in a flat object", () => {
  const result = deepDiff({ a: 1 }, { a: 1, b: 2 });
  assertEquals(result, { b: 2 });
});

Deno.test("deepDiff should detect a removed entry in a flat object", () => {
  const result = deepDiff({ a: 1, b: 2 }, { a: 1 });
  assertEquals(result, { b: undefined });
});

Deno.test("deepDiff should detect a changed value in a nested object", () => {
  const result = deepDiff({ a: { b: 1 } }, { a: { b: 2 } });
  assertEquals(result, { a: { b: 2 } });
});

Deno.test("deepDiff should detect an added entry in a nested object", () => {
  const result = deepDiff({ a: { b: 1 } }, { a: { b: 1, c: 2 } });
  assertEquals(result, { a: { c: 2 } });
});

Deno.test("deepDiff should detect a removed entry in a nested object", () => {
  const result = deepDiff({ a: { b: 1, c: 2 } }, { a: { b: 1 } });
  assertEquals(result, { a: { c: undefined } });
});

Deno.test("deepDiff should omit unchanged keys in objects when configured", () => {
  const left = { a: 1, b: 2 };
  const right = { a: 1, b: 3 };

  const result = deepDiff(left, right, { omit_unchanged_entries: false });
  assertEquals(result, { a: 1, b: 3 });
});

Deno.test("deepDiff should omit unchanged keys in nested objects when configured", () => {
  const left = { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } };
  const right = { a: { b: 2, c: 2 }, d: { e: 3, f: 5 } };

  const result = deepDiff(left, right, { a: { omit_unchanged_entries: true } });
  assertEquals(result, { a: { b: 2 }, d: { f: 5 } });
});

Deno.test("deepDiff should ignore specified keys in nested objects", () => {
  const left = { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } };
  const right = { a: { b: 2, c: 2 }, d: { e: 3, f: 5 } };

  const result = deepDiff(left, right, { a: { ignore_keys: ["b"] } });
  assertEquals(result, { d: { f: 5 } });
});

Deno.test("deepDiff should ignore specified keys in nested objects when omit_unchanged_entries is false", () => {
  const left = { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } };
  const right = { a: { b: 2, c: 2 }, d: { e: 4, f: 4 } };

  const result = deepDiff(left, right, {
    a: { omit_unchanged_entries: false },
  });
  assertEquals(result, { a: { b: 2, c: 2 }, d: { e: 4 } });
});

Deno.test("deepDiff should include unchanged keys in nested objects when configured", () => {
  const left = { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } };
  const right = { a: { b: 2, c: 2 }, d: { e: 3, f: 5 } };

  const result = deepDiff(left, right, {
    a: { omit_unchanged_entries: false },
  });
  assertEquals(result, { a: { b: 2, c: 2 }, d: { f: 5 } });
});

Deno.test("deepDiff should detect a changed value in an array", () => {
  const result = deepDiff({ a: [1] }, { a: [2] });
  assertEquals(result, { a: [2] });
});

Deno.test("deepDiff should detect an added entry in an array", () => {
  const result = deepDiff({ a: [1] }, { a: [1, 2] });
  assertEquals(result, { a: [1, 2] });
});

Deno.test("deepDiff should detect a removed entry in an array", () => {
  const result = deepDiff({ a: [1, 2] }, { a: [1] });
  assertEquals(result, { a: [1] });
});

Deno.test("deepDiff should detect a changed element in an array", () => {
  const result = deepDiff({ a: [1, 2, 3] }, { a: [1, 3, 2] });
  assertEquals(result, { a: [1, 3, 2] });
});

Deno.test("deepDiff should detect a changed object element in an array", () => {
  const result = deepDiff({ a: [{ b: 1 }] }, { a: [{ b: 2 }] });
  assertEquals(result, { a: [{ b: 2 }] });
});

Deno.test("deepDiff should detect changes in array elements using a unique key", () => {
  const result = deepDiff(
    { a: [{ id: 1, val: "foo" }] },
    { a: [{ id: 1, val: "baz" }] },
    { a: { unique_by: "id" } },
  );
  assertEquals(result, { a: [{ id: 1, val: "baz" }] });
});

Deno.test("deepDiff should omit unchanged array elements when using a unique key and omit_unchanged_elements is true", () => {
  const left = { a: [{ id: 1, val: "foo" }, { id: 2, val: "bar" }] };
  const right = { a: [{ id: 1, val: "foo" }, { id: 2, val: "baz" }] };

  const result = deepDiff(left, right, {
    a: { unique_by: "id", omit_unchanged_elements: true },
  });
  assertEquals(result, { a: [{ id: 2, val: "baz" }] });
});

Deno.test("deepDiff should include unchanged array elements when using a unique key and omit_unchanged_elements is false", () => {
  const left = { a: [{ id: 1, val: "foo" }, { id: 2, val: "bar" }] };
  const right = { a: [{ id: 1, val: "foo" }, { id: 2, val: "baz" }] };

  const result = deepDiff(left, right, {
    a: { unique_by: "id", omit_unchanged_elements: false },
  });
  assertEquals(result, {
    a: [{ id: 1, val: "foo" }, { id: 2, val: "baz" }],
  });
});

Deno.test("deepDiff should omit unchanged keys in array elements when omit_unchanged_entries is true", () => {
  const left = { a: [{ id: 1, val1: "foo", val2: "bar" }] };
  const right = { a: [{ id: 1, val1: "foo", val2: "baz" }] };

  const result = deepDiff(left, right, {
    a: { unique_by: "id", omit_unchanged_entries: true },
  });
  assertEquals(result, { a: [{ id: 1, val2: "baz" }] });
});

Deno.test("deepDiff should include unchanged keys in array elements when omit_unchanged_entries is false", () => {
  const left = { a: [{ id: 1, val1: "foo", val2: "bar" }] };
  const right = { a: [{ id: 1, val1: "foo", val2: "baz" }] };

  const result = deepDiff(left, right, {
    a: { unique_by: "id", omit_unchanged_entries: false },
  });
  assertEquals(result, { a: [{ id: 1, val1: "foo", val2: "baz" }] });
});

Deno.test("deepDiff should include unchanged keys in array elements when omit_unchanged_entries is false and omit_unchanged_elements is true", () => {
  const left = {
    a: [
      { id: 1, val1: "foo", val2: "bar" },
      { id: 2, val1: "baz", val2: "qux" },
    ],
  };
  const right = {
    a: [
      { id: 1, val1: "foo", val2: "baz" },
      { id: 2, val1: "baz", val2: "qux" },
    ],
  };

  const result = deepDiff(left, right, {
    a: {
      unique_by: "id",
      omit_unchanged_elements: true,
      omit_unchanged_entries: false,
    },
  });

  assertEquals(result, { a: [{ id: 1, val1: "foo", val2: "baz" }] });
});

Deno.test("deepDiff should ignore specified keys in array elements", () => {
  const result = deepDiff(
    { a: [{ id: 1, val1: "foo", val2: "bar" }] },
    { a: [{ id: 1, val1: "foo", val2: "baz" }] },
    { a: { unique_by: "id", ignore_keys: ["val2"] } },
  );
  assertEquals(result, {});
});

Deno.test("deepDiff should ignore specified keys in array elements with multiple changed keys", () => {
  const result = deepDiff(
    { a: [{ id: 1, val1: "foo", val2: "bar" }] },
    { a: [{ id: 1, val1: "baz", val2: "baz" }] },
    { a: { unique_by: "id", ignore_keys: ["val1"] } },
  );
  assertEquals(result, { a: [{ id: 1, val2: "baz" }] });
});

Deno.test("deepDiff should detect changes in complex objects", () => {
  const left = {
    images: [
      { id: 1, updated: "2021-01-01", url: "https://example.com/image.jpg" },
      { id: 2, updated: "2021-01-02", url: "https://example.com/image2.jpg" },
    ],
    meta_data: [
      { id: 11, key: "key1", value: "value1", data: "data1" },
      { id: 12, key: "key2", value: "value2", data: "data2" },
    ],
    line_items: [
      { id: 1, name: "Item 1", quantity: 1 },
      { id: 2, name: "Item 2", quantity: 2 },
    ],
    collection: [
      { id: 1, name: "foo", value: "bar" },
      { id: 2, name: "baz", value: "qux" },
    ],
    data: "data",
  };

  const right = {
    images: [
      { id: 1, updated: "2021-01-01", url: "https://example.com/image3.jpg" },
    ],
    meta_data: [{ id: 11, key: "key1", value: "value3" }],
    line_items: [
      { id: 1, name: "Item 1", quantity: 1 },
      { id: 2, name: "Item 2", quantity: 3 },
    ],
    collection: [
      { id: 1, name: "foo", value: "baz" },
      { id: 2, name: "baz", value: "qux" },
    ],
  };

  const result = deepDiff(left, right, {
    images: { unique_by: "id" },
    meta_data: {
      unique_by: "key",
      omit_unchanged_entries: false,
      ignore_missing: true,
    },
    line_items: { unique_by: "id", omit_unchanged_elements: true },
    collection: {
      unique_by: "id",
      omit_unchanged_elements: true,
      omit_unchanged_entries: false,
    },
    default: { omit_unchanged_entries: true, ignore_missing: true },
  });

  assertEquals(result, {
    images: [{ id: 1, url: "https://example.com/image3.jpg" }],
    meta_data: [{ id: 11, key: "key1", value: "value3" }],
    line_items: [{ id: 2, quantity: 3 }],
    collection: [{ id: 1, name: "foo", value: "baz" }],
  });
});

Deno.test("deepDiff example should work with advanced options", () => {
  const result = deepDiff(
    {
      products: [
        { id: 1, name: "Widget", stock: 10 },
        { id: 2, name: "Gadget", stock: 5 },
      ],
    },
    {
      products: [
        { id: 1, name: "Widget", stock: 8 },
        { id: 2, name: "Gadget Pro", stock: 5 },
      ],
    },
    {
      products: {
        unique_by: "id",
        omit_unchanged_entries: true,
        ignore_keys: ["stock"],
      },
    },
  );

  assertEquals(result, { products: [{ id: 2, name: "Gadget Pro" }] });
});

Deno.test("deepDiff example should work with smart array matching with unique IDs", () => {
  const result = deepDiff(
    { users: [{ id: 1, name: "Alice" }] },
    { users: [{ id: 1, name: "Alison" }] },
    { users: { unique_by: "id" } },
  );

  assertEquals(result, { users: [{ id: 1, name: "Alison" }] });
});
