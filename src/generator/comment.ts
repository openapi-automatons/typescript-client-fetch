import {OptionalKind, JSDocStructure, JSDocTagStructure} from "ts-morph";

export type CommentOptions = {
  title: string;
  async?: boolean;
  description?: string;
  deprecated?: boolean;
  readOnly?: boolean;
};

/**
 * Build a ts-morph JSDoc structure mirroring the previous comment partial.
 */
export const docs = (options: CommentOptions): OptionalKind<JSDocStructure>[] => {
  const tags: OptionalKind<JSDocTagStructure>[] = [];
  if (options.async) tags.push({tagName: "async"});
  if (options.description) tags.push({tagName: "description", text: options.description});
  if (options.deprecated) tags.push({tagName: "deprecated"});
  if (options.readOnly) tags.push({tagName: "readonly"});
  return [{description: options.title, tags}];
};
