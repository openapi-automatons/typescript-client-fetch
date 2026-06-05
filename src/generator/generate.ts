import {AutomatonSettings, Openapi} from "@automatons/tools";
import {parser} from "@automatons/parser";
import {write} from "./render";
import {emitModel, emitModelsIndex} from "./model";
import {emitConfig, emitIndex} from "./config";
import {emitAbstractApi} from "./abstractApi";
import {emitApi, emitApisIndex} from "./api";
import {emitStatics} from "./statics";

export const generate = async (openapi: Openapi, settings: AutomatonSettings): Promise<void[]> => {
  const {outDir} = settings;
  const {models, apis, securities} = await parser(openapi, settings);
  const tasks: Promise<void>[] = [];

  if (models.length) {
    tasks.push(write(outDir, "models/index.ts", emitModelsIndex(models)));
    models.forEach((model) => tasks.push(write(outDir, `models/${model.filename}.ts`, emitModel(model))));
  }

  if (apis.length) {
    tasks.push(write(outDir, "apis/index.ts", emitApisIndex(apis)));
    tasks.push(write(outDir, "apis/abstractApi.ts", emitAbstractApi(securities)));
    apis.forEach((api) => tasks.push(write(outDir, `apis/${api.filename}.ts`, emitApi(api, securities))));
  }

  tasks.push(write(outDir, "index.ts", emitIndex(models.length > 0, apis.length > 0)));
  tasks.push(write(outDir, "config.ts", emitConfig(securities)));
  tasks.push(emitStatics(outDir));

  return Promise.all(tasks);
};
