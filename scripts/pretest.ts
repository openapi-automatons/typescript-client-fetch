import {readdirSync, readFileSync} from "node:fs";
import {basename} from "node:path";
import generatorTypescriptFetchClient from '../src/index.ts'

const openapiDir = 'test/openapis/';
const outputDir = 'test/generates/';

Promise.all(readdirSync(openapiDir)
  .map(filename => generatorTypescriptFetchClient(JSON.parse(readFileSync(openapiDir + filename, {encoding: 'utf-8'})),
    {
      outDir: outputDir + basename(filename, '.json'),
      path: process.cwd(),
      openapiPath: openapiDir + filename
    },
    {})))
