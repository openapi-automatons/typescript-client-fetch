import {Openapi} from '@automatons/tools';
import {rm} from "node:fs/promises";
import {join} from 'path';
import {generate} from "../../generator";
import paths from "../../paths";
import {expectFormat} from "../expects/expectFormat";

const outDir = join(paths.tmp, 'serverName');

it('should generate with a 3.2 standard server name', async () => {
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
    {name: 'Main', url: 'https://api.example.com'}
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
                schema: {type: 'object'}
              }
            }
          }
        }
      }
    }
  }
};
