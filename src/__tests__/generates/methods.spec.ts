import {Openapi} from '@automatons/tools';
import {rm} from "node:fs/promises";
import {join} from 'path';
import {generate} from "../../generator";
import paths from "../../paths";
import {expectFormat} from "../expects/expectFormat";

const outDir = join(paths.tmp, 'methods');

it('should generate the 3.2 query method and additionalOperations', async () => {
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
    'items/': {
      // 3.2 fixed query method (idempotent read with a request body)
      query: {
        operationId: 'queryItems',
        requestBody: {
          content: {
            'application/json': {schema: {type: 'object', properties: {filter: {type: 'string'}}}}
          }
        },
        responses: {
          'application/json': {description: 'description', content: {'200': {schema: {type: 'object'}}}}
        }
      },
      // 3.2 additionalOperations: arbitrary HTTP method
      additionalOperations: {
        PURGE: {
          operationId: 'purgeItems',
          responses: {
            'application/json': {description: 'description', content: {'200': {schema: {type: 'object'}}}}
          }
        }
      }
    }
  }
};
