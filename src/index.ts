import {Automaton} from "@automatons/tools";
import {generate} from "./generator";

const generatorTypescriptFetchClient: Automaton = (openapi, settings) =>
  generate(openapi, settings);

export default generatorTypescriptFetchClient;
