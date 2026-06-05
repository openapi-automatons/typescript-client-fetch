import {Schema} from "@automatons/parser";

const quoteKey = (name: string): string => (name.includes("-") ? `"${name}"` : name);

const nullable = (schema: {nullable?: boolean}): string => (schema.nullable ? " | null" : "");

/**
 * Render a parser Schema (a discriminated union) as a TypeScript type string.
 * Mirrors the previous models/* handlebars partials.
 */
export const schemaToType = (schema: Schema): string => {
  switch (schema.type) {
    case "model":
      return schema.name;
    case "object": {
      if (schema.properties && schema.properties.length) {
        const props = schema.properties
          .map(
            (property) =>
              `/**\n * ${property.name}\n */\n${quoteKey(property.name)}${
                property.required ? "" : "?"
              }: ${schemaToType(property.schema)};`,
          )
          .join("\n");
        return `{\n${props}\n}${nullable(schema)}`;
      }
      return `object${nullable(schema)}`;
    }
    case "allOf":
      return `(${schema.schemas.map(schemaToType).join(" & ")})`;
    case "oneOf":
      return `(${schema.schemas.map(schemaToType).join(" | ")})`;
    case "array":
      return `${schema.items ? `Array<${schemaToType(schema.items)}>` : "any[]"}${nullable(schema)}`;
    case "boolean":
      return `boolean${nullable(schema)}`;
    case "string": {
      const base =
        schema.enum && schema.enum.length
          ? schema.enum.map((value) => `"${value}"`).join(" | ")
          : schema.format === "date" || schema.format === "date-time"
            ? "Date"
            : schema.format === "url"
              ? "URL"
              : "string";
      return `${base}${nullable(schema)}`;
    }
    case "integer":
    case "number": {
      const base = schema.enum && schema.enum.length ? schema.enum.join(" | ") : "number";
      return `${base}${nullable(schema)}`;
    }
    default:
      throw new Error(`Unsupported schema type: ${(schema as {type: string}).type}`);
  }
};
