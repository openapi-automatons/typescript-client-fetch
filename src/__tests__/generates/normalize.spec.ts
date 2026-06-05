import {Openapi} from '@automatons/tools';
import {rm} from "node:fs/promises";
import {join} from 'path';
import {generate} from "../../generator";
import paths from "../../paths";
import {expectFormat} from "../expects/expectFormat";

const outDir = join(paths.tmp, 'normalize');

it('should generate with 3.1 type arrays and const', async () => {
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
                schema: {$ref: '#/components/schemas/Mixed'}
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      // type: ["string", "null"] -> string | null
      NullableName: {type: ['string', 'null']} as never,
      // const -> single-value literal
      Status: {const: 'active'} as never,
      // multiple types -> union
      Mixed: {type: ['string', 'number']} as never,
      // multiple types + null -> nullable union
      NullableMixed: {type: ['string', 'number', 'null']} as never
    }
  }
};
