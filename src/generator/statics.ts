import path from "node:path";
import {readdir, readFile} from "node:fs/promises";
import paths from "../paths";
import {write} from "./render";

/**
 * Copy the static utility files (template/query/formData/index) into the output.
 */
export const emitStatics = async (outDir: string): Promise<void> => {
  const dir = path.join(paths.static, "utils");
  const files = await readdir(dir);
  await Promise.all(
    files.map(async (file) => {
      const text = await readFile(path.join(dir, file), {encoding: "utf-8"});
      await write(outDir, path.join("utils", file), text);
    }),
  );
};
