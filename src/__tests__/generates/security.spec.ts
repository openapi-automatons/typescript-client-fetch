import {Openapi} from '@automatons/tools';
import {rm} from "node:fs/promises";
import {expectFormat} from "../expects/expectFormat";
import {generate} from "../../generator";
import paths from "../../paths";
import { join } from 'path';

const outDir = join(paths.tmp, 'security');

it('should generate with security', async () => {
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
