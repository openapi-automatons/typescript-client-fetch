import {Openapi} from '@automatons/tools';
import {rm} from "node:fs/promises";
import {join} from 'path';
import {generate} from "../../generator";
import paths from "../../paths";
import {expectFormat} from "../expects/expectFormat";

const outDir = join(paths.tmp, 'query');

it('should generate with query', async () => {
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
        parameters: [{
          name: 'token',
          in: 'query',
          style: 'form',
          description: 'token',
          required: true,
          schema: {
            type: 'string'
          }
        }, {
          name: 'test',
          in: 'query',
          style: 'form',
          explode: true,
          description: 'fizz',
          schema: {
            type: "object",
            properties: {
              fizz: {
                type: "string"
              },
              buss: {
                type: "string"
              }
            }
          }
        }],
        responses: {
          'application/json': {
            description: 'description',
            content: {
              '200': {
                schema: {
                  type: 'object'
                }
              }
            }
          }
        }
      }
    }
  }
};
