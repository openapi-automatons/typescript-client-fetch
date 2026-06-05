import {query} from "../generates/petstore/utils";

test.each<[Parameters<typeof query>[2],Parameters<typeof query>[3], object]>([
  ['form', true, {key: 'value'}],
  ['form', false, {name: 'key,value'}],
  ['spaceDelimited', true, {name: 'key value'}],
  ['spaceDelimited', false, {name: 'key value'}],
  ['pipeDelimited', true, {name: 'key|value'}],
  ['pipeDelimited', false, {name: 'key|value'}],
  ['deepObject', true, {'name[key]': 'value'}],
  ['deepObject', false, {'name[key]': 'value'}],
])('object(%s, %s)', ( style, explode, expected) => {
  expect(query('name', {key: 'value'}, style, explode)).toEqual(expected)
})
