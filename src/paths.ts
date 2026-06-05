import path from "node:path";

const paths = {
  static: path.resolve(import.meta.dirname, "static"),
  tmp: path.resolve(import.meta.dirname, "../tmp"),
};
export default paths;
