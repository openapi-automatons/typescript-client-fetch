import {describe, expect, it} from "vitest";
import {schemaToType} from "./schema";

describe("schemaToType", () => {
  it("renders primitives", () => {
    expect(schemaToType({type: "string"})).toBe("string");
    expect(schemaToType({type: "number"})).toBe("number");
    expect(schemaToType({type: "integer"})).toBe("number");
    expect(schemaToType({type: "boolean"})).toBe("boolean");
  });

  it("renders string formats and enums", () => {
    expect(schemaToType({type: "string", format: "date"})).toBe("Date");
    expect(schemaToType({type: "string", format: "date-time"})).toBe("Date");
    expect(schemaToType({type: "string", format: "url"})).toBe("URL");
    expect(schemaToType({type: "string", enum: ["a", "b"]})).toBe('"a" | "b"');
    expect(schemaToType({type: "number", enum: [1, 2]})).toBe("1 | 2");
  });

  it("applies nullable", () => {
    expect(schemaToType({type: "string", nullable: true})).toBe("string | null");
    expect(schemaToType({type: "boolean", nullable: true})).toBe("boolean | null");
  });

  it("renders arrays", () => {
    expect(schemaToType({type: "array", items: {type: "string"}})).toBe("Array<string>");
    expect(schemaToType({type: "array"})).toBe("any[]");
  });

  it("renders model references", () => {
    expect(schemaToType({type: "model", name: "Pet"})).toBe("Pet");
  });

  it("renders allOf and oneOf", () => {
    expect(schemaToType({type: "allOf", schemas: [{type: "model", name: "A"}, {type: "model", name: "B"}]})).toBe("(A & B)");
    expect(schemaToType({type: "oneOf", schemas: [{type: "model", name: "A"}, {type: "model", name: "B"}]})).toBe("(A | B)");
  });

  it("renders objects with properties", () => {
    const type = schemaToType({
      type: "object",
      properties: [
        {name: "id", required: true, schema: {type: "number"}},
        {name: "tag", required: false, schema: {type: "string"}},
      ],
    });
    expect(type).toContain("id: number;");
    expect(type).toContain("tag?: string;");
    expect(schemaToType({type: "object"})).toBe("object");
  });
});
