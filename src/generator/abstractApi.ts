import {Security} from "@automatons/parser";
import {OptionalKind, MethodDeclarationOverloadStructure, Scope} from "ts-morph";
import {render} from "./render";
import {docs} from "./comment";

const FETCH_STATEMENTS = [
  "const DateFormat = /^\\d{4}-\\d{2}-\\d{2}([tT]\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})|Z)?$/;",
  "const reviver = (_key: string, value: any) => typeof value === 'string' && DateFormat.test(value) ? new Date(value) : value;",
  "const toQuery = (params: Record<string, unknown>): string => { const search = new URLSearchParams(); for (const [key, value] of Object.entries(params)) { if (value === undefined || value === null) continue; if (Array.isArray(value)) { value.forEach((item) => search.append(key, String(item))); } else { search.append(key, String(value)); } } return search.toString(); };",
];

const REQUEST_STATEMENTS = [
  "const { baseURL, params, headers, ...init } = config;",
  "const search = toQuery(params);",
  'const url = `${baseURL}${path}${search ? `?${search}` : ""}`;',
  "const _headers = new Headers(headers);",
  'if (init.body instanceof FormData) { _headers.delete("Content-Type"); }',
  "const response = await this.fetch(url, { ...init, method, headers: _headers });",
  "const text = await response.text();",
  "const data = (text ? JSON.parse(text, reviver) : undefined) as T;",
  "return { data, status: response.status, statusText: response.statusText, headers: response.headers, response };",
];

const overload = (security: Security): OptionalKind<MethodDeclarationOverloadStructure> => {
  const base = {scope: Scope.Protected, isAsync: true};
  if (security.type === "http" && security.scheme === "basic") {
    return {
      ...base,
      parameters: [{name: "key", type: `"${security.name}"`}],
      returnType: "Promise<{username: string; password: string;}>",
    };
  }
  if (security.type === "oauth2" || security.type === "openIdConnect") {
    return {
      ...base,
      parameters: [{name: "key", type: `"${security.name}"`}, {name: "scopes", type: "string[]"}],
      returnType: "Promise<string>",
    };
  }
  return {...base, parameters: [{name: "key", type: `"${security.name}"`}], returnType: "Promise<string>"};
};

/**
 * Emit apis/abstractApi.ts: the shared fetch runtime plus the AbstractConfig / AbstractApi base classes.
 */
export const emitAbstractApi = (securities: Security[]): string =>
  render((sf) => {
    sf.addImportDeclaration({
      isTypeOnly: true,
      namedImports: securities.length ? ["Config", "Security"] : ["Config"],
      moduleSpecifier: "../config",
    });

    sf.addTypeAlias({
      isExported: true,
      name: "RequestConfig",
      type: "Omit<RequestInit, 'headers'> & { baseURL: string; params: Record<string, unknown>; headers: Record<string, string>; }",
    });
    sf.addTypeAlias({
      isExported: true,
      name: "FetchResponse",
      typeParameters: [{name: "T", default: "unknown"}],
      type: "{ data: T; status: number; statusText: string; headers: Headers; response: Response; }",
    });

    sf.addStatements(FETCH_STATEMENTS);

    const abstractConfig = sf.addClass({isExported: true, name: "AbstractConfig", docs: docs({title: "AbstractConfig"})});
    if (securities.length) {
      abstractConfig.addProperty({name: "#security", isReadonly: true, type: "Security"});
      abstractConfig.addConstructor({
        docs: docs({title: "constructor"}),
        parameters: [{name: "security", type: "Security", initializer: "{}"}],
        statements: ["this.#security = security;"],
      });
      const scoped = securities.some((s) => s.type === "oauth2" || s.type === "openIdConnect");
      abstractConfig.addMethod({
        scope: Scope.Protected,
        isAsync: true,
        name: "security",
        overloads: securities.map(overload),
        parameters: [
          {name: "key", type: "keyof Security"},
          ...(scoped ? [{name: "scopes", type: "string[]", hasQuestionToken: true}] : []),
        ],
        returnType: "Promise<string | {username: string; password: string;}>",
        statements: [
          "const security = this.#security[key];",
          'if (!security) { throw new Error("Unauthorized user request."); }',
          `else if (security instanceof Function) { ${scoped ? "return scopes ? security(scopes) : security();" : "return security();"} }`,
          "return security;",
        ],
      });
    }

    const abstractApi = sf.addClass({isExported: true, name: "AbstractApi", docs: docs({title: "AbstractApi"})});
    abstractApi.addProperty({scope: Scope.Protected, name: "fetch", type: "typeof fetch", initializer: "fetch"});
    abstractApi.addConstructor({
      docs: docs({title: "constructor"}),
      parameters: [{name: "config", type: "Config"}],
      statements: ["if (config.fetch) { this.fetch = config.fetch; }"],
    });
    abstractApi.addMethod({
      scope: Scope.Protected,
      isAsync: true,
      name: "request",
      typeParameters: [{name: "T", default: "unknown"}],
      parameters: [
        {name: "path", type: "string"},
        {name: "method", type: "string"},
        {name: "config", type: "RequestConfig"},
      ],
      returnType: "Promise<FetchResponse<T>>",
      statements: REQUEST_STATEMENTS,
    });
  });
