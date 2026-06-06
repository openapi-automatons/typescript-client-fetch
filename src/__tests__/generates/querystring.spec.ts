import {Openapi} from '@automatons/tools';
import {rm} from "node:fs/promises";
import {join} from 'path';
import {generate} from "../../generator";
import paths from "../../paths";
import {expectFormat} from "../expects/expectFormat";

const outDir = join(paths.tmp, 'querystring');

it('should generate a 3.2 querystring parameter', async () => {
  await generate(openapi, {path: '', openapiPath: '', outDir});

  await expectFormat();
});

beforeEach(async () => {
  await rm(outDir, {recursive: true, force: true});
});

const openapi: Openapi = {
  openapi: '3.2.0',
  info: {
    title: 'example',
    version: '0.0.0'
  },
  servers: [
    {url: 'test'}
  ],
  paths: {
    'search/': {
      get: {
        operationId: 'search',
        // 3.2 querystring: the whole query string described by one content schema
        parameters: [{
          in: 'querystring',
          name: '',
          content: {
            'application/x-www-form-urlencoded': {
              schema: {type: 'object', properties: {q: {type: 'string'}, page: {type: 'integer'}}}
            }
          }
        }],
        responses: {
          'application/json': {description: 'description', content: {'200': {schema: {type: 'object'}}}}
        }
      }
    }
  }
};
