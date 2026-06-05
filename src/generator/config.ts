import {Security} from "@automatons/parser";
import {render} from "./render";

const callable = (returns: string, arg = ""): string =>
  `${returns} | Promise<${returns}> | ((${arg}) => ${returns} | Promise<${returns}>)`;

const securityType = (security: Security): string => {
  if (security.type === "http" && security.scheme === "basic") {
    const basic = "{username: string; password: string;}";
    return `${security.name}?: ${callable(basic)};`;
  }
  if (security.type === "oauth2" || security.type === "openIdConnect") {
    return `${security.name}?: ${callable("string", "scopes?: string[]")};`;
  }
  return `${security.name}?: ${callable("string")};`;
};

/**
 * Emit config.ts: the Security map type and the Config type.
 */
export const emitConfig = (securities: Security[]): string =>
  render((sf) => {
    sf.addTypeAlias({
      isExported: true,
      name: "Security",
      type: `{\n${securities.map(securityType).join("\n")}\n}`,
    });
    sf.addTypeAlias({
      isExported: true,
      name: "Config",
      type: `{
  fetch?: typeof fetch;
  token?: string | Promise<string> | (() => string | Promise<string>);
  security?: Security;
}`,
    });
  });

/**
 * Emit the top-level index.ts.
 */
export const emitIndex = (hasModels: boolean, hasApis: boolean): string =>
  render((sf) => {
    if (hasModels) sf.addExportDeclaration({moduleSpecifier: "./models"});
    if (hasApis) sf.addExportDeclaration({moduleSpecifier: "./apis"});
    sf.addExportDeclaration({moduleSpecifier: "./config"});
  });
