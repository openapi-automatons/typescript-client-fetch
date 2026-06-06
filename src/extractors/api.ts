import {AffectPath, Api, Path} from "@automatons/parser";

const isAffectPath = (path: Path): path is AffectPath => 'forms' in path;

export const extractApiMeta = (api: Api) => {
  const hasTemplate = api.servers.some(server => server.values?.length)
    || api.paths.some(path => path.parameters?.length)
    || api.paths.some(path => path.headers?.length);
  const hasQuery = api.paths.some(path => path.queries?.length)
    || api.paths.some(path => path.cookies?.length);
  const hasFormData = api.paths.some(path => isAffectPath(path) ? path.forms?.length : false);
  return {hasQuery, hasTemplate, hasFormData};
};
