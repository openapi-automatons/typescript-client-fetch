import {Openapi} from '@automatons/tools';
import {rm} from "node:fs/promises";
import {join} from 'path';
import {generate} from "../../generator";
import paths from "../../paths";
import {expectFormat} from "../expects/expectFormat";

const outDir = join(paths.tmp, 'anyOf');

it('should generate with anyOf', async () => {
  await generate(openapi, {path: '', openapiPath: '', outDir});

  await expectFormat();
});

beforeEach(async () => {
  await rm(outDir, {recursive: true, force: true});
});

const openapi: Openapi = {
  openapi: '3.1.0',
  info: {
    title: 'example',
    version: '0.0.0'
  },
  servers: [
    {url: 'test'}
  ],
  paths: {
    'test/': {
      get: {
        operationId: 'operationId',
        responses: {
          'application/json': {
            description: 'description',
            content: {
              '200': {
                schema: {$ref: '#/components/schemas/Animal'}
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Cat: {type: 'object', properties: {meow: {type: 'string'}}},
      Dog: {type: 'object', properties: {bark: {type: 'string'}}},
      Animal: {
        anyOf: [
          {$ref: '#/components/schemas/Cat'},
          {$ref: '#/components/schemas/Dog'}
        ]
      }
    }
  }
};
