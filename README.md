# @automatons/typescript-client-fetch
[![CI/CD](https://github.com/openapi-automatons/typescript-client-fetch/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/openapi-automatons/typescript-client-fetch/actions/workflows/ci-cd.yml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm downloads](https://img.shields.io/npm/dw/@automatons/typescript-client-fetch)](https://www.npmjs.com/package/@automatons/typescript-client-fetch)

## What is @automatons/typescript-client-fetch
This is a client generator that emits a typed client built on the standard `fetch` API (no `axios` dependency).
Only use openapi-automatons.

This package is **ESM-only** and requires **Node.js >= 22**.

Each generated operation returns a `FetchResponse<T>` (`{ data, status, statusText, headers, response }`), so consumers can write `const { data } = await api.xxx()`.
Non-2xx responses are **not** thrown — inspect `response.ok` / `status` instead.

## Generated client
```ts
import { PetsApi } from "./clients";

const api = new PetsApi({
  // `fetch` defaults to the global fetch; pass one to customise it
  security: { bearerAuth: () => getToken() }, // auth for the document's security schemes
});

const { data, response } = await api.showPetById("1");
if (!response.ok) {
  // non-2xx is not thrown — handle it here
}
```

## How can I use @automatons/typescript-client-fetch?
This library is designed to be used by [openapi-automatons](https://github.com/openapi-automatons/openapi-automatons).
Please read the [readme](https://github.com/openapi-automatons/openapi-automatons/blob/main/README.md) of [openapi-automatons](https://github.com/openapi-automatons/openapi-automatons) for how to use it.
