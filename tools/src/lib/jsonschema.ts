/**
 * Minimal JSON-Schema (draft-07 subset) validator — no dependencies.
 *
 * Supported keywords: type, required, properties, additionalProperties,
 * enum, pattern, minLength, maxLength, minimum, maximum, items, minItems,
 * maxItems. This covers everything the ClaudeMax schemas use. Unsupported
 * keywords are ignored rather than erroring, so schemas stay forward-compatible.
 */

export interface Schema {
  type?: string | string[];
  required?: string[];
  properties?: { [key: string]: Schema };
  additionalProperties?: boolean | Schema;
  enum?: unknown[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  items?: Schema;
  minItems?: number;
  maxItems?: number;
  [key: string]: unknown;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function matchesType(value: unknown, type: string): boolean {
  const actual = typeOf(value);
  if (type === "number") return actual === "number" || actual === "integer";
  if (type === "integer") return actual === "integer";
  return actual === type;
}

function validateNode(value: unknown, schema: Schema, path: string, issues: ValidationIssue[]): void {
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      issues.push({ path, message: `expected type ${types.join(" | ")} but got ${typeOf(value)}` });
      return;
    }
  }

  if (schema.enum !== undefined && !schema.enum.some((e) => e === value)) {
    issues.push({ path, message: `value ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}` });
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      issues.push({ path, message: `string shorter than minLength ${schema.minLength} (got ${value.length})` });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      issues.push({ path, message: `string longer than maxLength ${schema.maxLength} (got ${value.length})` });
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      issues.push({ path, message: `string does not match pattern /${schema.pattern}/` });
    }
  }

  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      issues.push({ path, message: `number below minimum ${schema.minimum}` });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      issues.push({ path, message: `number above maximum ${schema.maximum}` });
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      issues.push({ path, message: `array shorter than minItems ${schema.minItems}` });
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      issues.push({ path, message: `array longer than maxItems ${schema.maxItems}` });
    }
    if (schema.items !== undefined) {
      value.forEach((item, i) => validateNode(item, schema.items!, `${path}[${i}]`, issues));
    }
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as { [k: string]: unknown };
    for (const key of schema.required ?? []) {
      if (!(key in obj) || obj[key] === undefined) {
        issues.push({ path: path === "" ? key : `${path}.${key}`, message: "missing required property" });
      }
    }
    const props = schema.properties ?? {};
    for (const [key, sub] of Object.entries(props)) {
      if (key in obj && obj[key] !== undefined) {
        validateNode(obj[key], sub, path === "" ? key : `${path}.${key}`, issues);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in props)) {
          issues.push({ path: path === "" ? key : `${path}.${key}`, message: "unknown property not allowed by schema" });
        }
      }
    } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      for (const key of Object.keys(obj)) {
        if (!(key in props)) {
          validateNode(obj[key], schema.additionalProperties, path === "" ? key : `${path}.${key}`, issues);
        }
      }
    }
  }
}

export function validate(value: unknown, schema: Schema): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  validateNode(value, schema, "", issues);
  return issues;
}
