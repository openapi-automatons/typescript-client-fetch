import {AffectPath, Api, Path, Schema, Security, Server} from "@automatons/parser";
import {OptionalKind, ParameterDeclarationStructure, Scope} from "ts-morph";
import {render} from "./render";
import {schemaToType} from "./schema";
import {docs} from "./comment";
import {extractApiMeta} from "../extractors/api";

const isAffect = (path: Path): path is AffectPath => "forms" in path;
const formsOf = (path: Path): NonNullable<AffectPath["forms"]> => (isAffect(path) && path.forms ? path.forms : []);

type Entry = {name: string; required?: boolean; schema: Schema};
const objectType = (entries: ReadonlyArray<Entry>): string =>
  `{ ${entries.map((e) => `${e.name}${e.required ? "" : "?"}: ${schemaToType(e.schema)}, `).join("")}}`;
const allOptional = (entries: ReadonlyArray<{required?: boolean}> = []): boolean => entries.every((e) => !e.required);

const contentType = (path: Path): string => {
  const forms = formsOf(path);
  return forms.length
    ? forms.map((form) => form.types.map((type) => `'${type}'`).join(" | ")).join(" | ")
    : "'application/json'";
};
const headersType = (path: Path): string =>
  `{ 'Content-Type': ${contentType(path)}, ${(path.headers ?? [])
    .map((h) => `${h.name}${h.required ? "" : "?"}: ${schemaToType(h.schema)}, `)
    .join("")}}`;

const serverUnion = (servers: Server[]): string => servers.map((server) => `${server.name}Server`).join(" | ");
const serverDefault = (servers: Server[]): string | undefined => {
  const [first] = servers;
  return servers.length === 1 && first && !(first.values && first.values.length)
    ? `{ name: '${first.name}' }`
    : undefined;
};

const withInit = (init?: string): {initializer: string} | object => (init ? {initializer: init} : {});

const queriesParam = (path: Path): OptionalKind<ParameterDeclarationStructure> | undefined =>
  path.queries?.length
    ? {name: "queries", type: objectType(path.queries), ...withInit(allOptional(path.queries) ? "{}" : undefined)}
    : undefined;
const queryStringParam = (path: Path): OptionalKind<ParameterDeclarationStructure> | undefined =>
  path.querystring
    ? {name: "querystring", type: schemaToType(path.querystring), hasQuestionToken: true}
    : undefined;
const cookiesParam = (path: Path): OptionalKind<ParameterDeclarationStructure> | undefined =>
  path.cookies?.length
    ? {name: "cookies", type: objectType(path.cookies), ...withInit(allOptional(path.cookies) ? "{}" : undefined)}
    : undefined;
const headersParam = (path: Path): OptionalKind<ParameterDeclarationStructure> => ({
  name: "headers",
  type: headersType(path),
  ...withInit(allOptional(path.headers) ? "{ 'Content-Type': 'application/json' }" : undefined),
});
const serverParam = (path: Path): OptionalKind<ParameterDeclarationStructure> | undefined =>
  path.servers?.length
    ? {name: "server", type: serverUnion(path.servers), ...withInit(serverDefault(path.servers))}
    : undefined;
const configParam = (): OptionalKind<ParameterDeclarationStructure> => ({
  name: "config",
  type: "RequestInit",
  hasQuestionToken: true,
});
const compact = <T>(items: (T | undefined)[]): T[] => items.filter((item): item is T => item !== undefined);

const requestParams = (path: Path): OptionalKind<ParameterDeclarationStructure>[] => {
  const forms = formsOf(path);
  return compact([
    ...(path.parameters ?? []).map((p) => ({name: p.name, type: schemaToType(p.schema)})),
    forms.length ? {name: "form", type: forms.map((form) => schemaToType(form.schema)).join(" | ")} : undefined,
    queriesParam(path),
    queryStringParam(path),
    cookiesParam(path),
    headersParam(path),
    serverParam(path),
    configParam(),
  ]);
};
const configParams = (path: Path): OptionalKind<ParameterDeclarationStructure>[] =>
  compact([queriesParam(path), queryStringParam(path), cookiesParam(path), headersParam(path), serverParam(path), configParam()]);

const requestVariables = (path: Path): string =>
  compact([
    path.queries?.length ? "queries" : undefined,
    path.querystring ? "querystring" : undefined,
    path.cookies?.length ? "cookies" : undefined,
    "headers",
    path.servers?.length ? "server" : undefined,
    "config",
  ]).join(", ");

const requestBody = (api: Api, path: Path): string[] => {
  const forms = formsOf(path);
  const replaces = (path.parameters ?? [])
    .map((p) => `.replace("{${p.name}}", template('${p.name}', ${p.name}, '${p.style ?? "simple"}', ${p.explode ?? false}))`)
    .join("");
  void api;
  const generic = path.schema ? `<${schemaToType(path.schema)}>` : "";
  const request = forms.length
    ? `{ ...requestConfig, body: body(headers['Content-Type'], form) }`
    : "requestConfig";
  return compact([
    `const path = "${path.path}"${replaces};`,
    `const requestConfig = await this.#config.${path.name}(${requestVariables(path)});`,
    `return this.request${generic}(path, "${path.method.toUpperCase()}", ${request});`,
  ]);
};

const configBody = (api: Api, path: Path): string[] => {
  const securities = path.securities ?? [];
  const params = compact([
    ...(path.queries ?? []).map((q) => `...query("${q.name}", queries.${q.name}, '${q.style ?? "form"}', ${q.explode ?? false}),`),
    path.querystring ? "...querystring," : undefined,
    ...securities.map((s) => (s.type === "apiKey" && s.in === "query" ? `${s.key}: await this.security("${s.name}"),` : undefined)),
  ]);
  const cookieStatements = compact<string>([
    ...(path.cookies ?? []).map(
      (c) =>
        `if (cookies.${c.name}) { _cookies += Object.entries(query('${c.name}', cookies.${c.name}, 'form', ${c.explode ?? false})).reduce((pre, [key, value]) => \`\${pre}\${key}=\${value};\`, ''); }`,
    ),
    ...securities.flatMap((s) =>
      s.type === "apiKey" && s.in === "cookie"
        ? [
            `const _cookie${s.name} = await this.security("${s.name}");`,
            `if (_cookie${s.name}) { _cookies += \`${s.key}=\${_cookie${s.name}};\`; }`,
          ]
        : [],
    ),
  ]);
  const headerStatements = compact<string>([
    ...(path.headers ?? []).map(
      (h) => `if (headers.${h.name}) { _headers['${h.name}'] = template('${h.name}', headers.${h.name}, 'simple', ${h.explode ?? false}); }`,
    ),
    ...securities.map((s) => {
      if (s.type === "apiKey" && s.in === "header") return `_headers['${s.key}'] = await this.security("${s.name}");`;
      if (s.type === "http" && s.scheme === "bearer") return `_headers['Authorization'] = \`Bearer \${await this.security("${s.name}")}\`;`;
      if (s.type === "http" && s.scheme === "basic")
        return `const _basic${s.name} = await this.security("${s.name}"); _headers['Authorization'] = \`Basic \${btoa(\`\${_basic${s.name}.username}:\${_basic${s.name}.password}\`)}\`;`;
      if (s.type === "oauth2" || s.type === "openIdConnect")
        return `_headers['Authorization'] = \`Bearer \${await this.security("${s.name}", [${s.scopes.map((x) => `"${x}"`).join(", ")}])}\`;`;
      return undefined;
    }),
  ]);
  const hasCookies = cookieStatements.length > 0;
  return compact([
    `const params = { ${params.join(" ")} };`,
    hasCookies ? "let _cookies = '';" : undefined,
    ...cookieStatements,
    "const _headers = Object.fromEntries(new Headers(config?.headers)) as Record<string, string>;",
    "_headers['Content-Type'] = headers['Content-Type'];",
    ...headerStatements,
    hasCookies ? "if (_cookies) { _headers['Cookie'] = _cookies; }" : undefined,
    `return { ...config, baseURL: ${api.title}Config.server(server), params, headers: _headers };`,
  ]);
};

const serverTypeAlias = (server: Server): string => {
  const values = server.values?.length
    ? `; values: { ${server.values
        .map((v) => `${v.name}: ${v.enums?.length ? v.enums.map((e) => `'${e}'`).join(" | ") : "string"} `)
        .join("")}}`
    : "";
  return `{ name: "${server.name}"${values} }`;
};

const serverMethodStatements = (servers: Server[]): string[] => [
  ...servers.map((server) => {
    const replaces = (server.values ?? [])
      .map((v) => `.replace('{${v.name}}', template('${v.name}', server.values.${v.name}, 'simple', false))`)
      .join("");
    return `if ('${server.name}' === server.name) { return '${server.url}'${replaces}; }`;
  }),
  "throw new Error('Undefined server. please define server.');",
];

const utilImports = (api: Api): string[] => {
  const meta = extractApiMeta(api);
  return compact([meta.hasTemplate ? "template" : undefined, meta.hasQuery ? "query" : undefined, meta.hasFormData ? "body" : undefined]);
};

/**
 * Emit a single api file: the typed fetch client class and its request-config class.
 */
export const emitApi = (api: Api, securities: Security[]): string =>
  render((sf) => {
    sf.addImportDeclaration({
      namedImports: ["AbstractApi", "AbstractConfig", "FetchResponse", "RequestConfig"],
      moduleSpecifier: "./abstractApi",
    });
    sf.addImportDeclaration({
      namedImports: securities.length ? ["Config", "Security"] : ["Config"],
      moduleSpecifier: "../config",
    });
    const utils = utilImports(api);
    if (utils.length) sf.addImportDeclaration({namedImports: utils, moduleSpecifier: "../utils"});
    if (api.imports.length) sf.addImportDeclaration({namedImports: api.imports.map((m) => m.title), moduleSpecifier: "../models"});

    api.servers.forEach((server) => sf.addTypeAlias({name: `${server.name}Server`, type: serverTypeAlias(server)}));

    const apiClass = sf.addClass({isExported: true, name: api.title, extends: "AbstractApi", docs: docs({title: api.title})});
    apiClass.addProperty({name: "#config", isReadonly: true, type: `${api.title}Config`});
    apiClass.addConstructor({
      docs: docs({title: "constructor"}),
      parameters: [{name: "config", type: "Config", initializer: "{}"}],
      statements: ["super(config);", `this.#config = new ${api.title}Config(${securities.length ? "config.security" : ""});`],
    });
    api.paths.forEach((path) =>
      apiClass.addMethod({
        scope: Scope.Public,
        isAsync: true,
        name: path.name,
        docs: docs({title: path.name, async: true}),
        parameters: requestParams(path),
        returnType: `Promise<FetchResponse${path.schema ? `<${schemaToType(path.schema)}>` : ""}>`,
        statements: requestBody(api, path),
      }),
    );

    const configClass = sf.addClass({name: `${api.title}Config`, extends: "AbstractConfig"});
    if (securities.length)
      configClass.addConstructor({
        parameters: [{name: "security", type: "Security", initializer: "{}"}],
        statements: ["super(security);"],
      });
    configClass.addMethod({
      isStatic: true,
      scope: Scope.Private,
      name: "server",
      parameters: [{name: "server", type: serverUnion(api.servers.length ? api.servers : api.paths[0]?.servers ?? [])}],
      statements: serverMethodStatements(api.servers.length ? api.servers : api.paths[0]?.servers ?? []),
    });
    api.paths.forEach((path) =>
      configClass.addMethod({
        scope: Scope.Public,
        isAsync: true,
        name: path.name,
        parameters: configParams(path),
        returnType: "Promise<RequestConfig>",
        statements: configBody(api, path),
      }),
    );
  });

/**
 * Emit apis/index.ts re-exporting every api.
 */
export const emitApisIndex = (apis: Api[]): string =>
  render((sf) => apis.forEach((api) => sf.addExportDeclaration({moduleSpecifier: `./${api.filename}`})));
