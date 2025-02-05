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

Deno.test("deepDiff should omit unchanged keys in nested objects when configured", () => {
  const left = { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } };
  const right = { a: { b: 2, c: 2 }, d: { e: 3, f: 5 } };

  const result = deepDiff(left, right, { a: { omit_unchanged_keys: true } });
  assertEquals(result, { a: { b: 2 }, d: { f: 5 } });
});

Deno.test("deepDiff should ignore specified keys in nested objects", () => {
  const left = { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } };
  const right = { a: { b: 2, c: 2 }, d: { e: 3, f: 5 } };

  const result = deepDiff(left, right, { a: { ignore_keys: ["b"] } });
  assertEquals(result, { d: { f: 5 } });
});

Deno.test("deepDiff should ignore specified keys in nested objects when omit_unchanged_keys is false", () => {
  const left = { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } };
  const right = { a: { b: 2, c: 2 }, d: { e: 4, f: 4 } };

  const result = deepDiff(left, right, {
    a: { omit_unchanged_keys: false },
  });
  assertEquals(result, { a: { b: 2, c: 2 }, d: { e: 4 } });
});

Deno.test("deepDiff should include unchanged keys in nested objects when configured", () => {
  const left = { a: { b: 1, c: 2 }, d: { e: 3, f: 4 } };
  const right = { a: { b: 2, c: 2 }, d: { e: 3, f: 5 } };

  const result = deepDiff(left, right, { a: { omit_unchanged_keys: false } });
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

Deno.test("deepDiff should omit unchanged keys in array elements when omit_unchanged_keys is true", () => {
  const left = { a: [{ id: 1, val1: "foo", val2: "bar" }] };
  const right = { a: [{ id: 1, val1: "foo", val2: "baz" }] };

  const result = deepDiff(left, right, {
    a: { unique_by: "id", omit_unchanged_keys: true },
  });
  assertEquals(result, { a: [{ id: 1, val2: "baz" }] });
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
