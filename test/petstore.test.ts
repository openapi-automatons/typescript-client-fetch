import {PetsApi} from "./generates/petstore";

describe('petstore', () => {
  test('showPetById', async () => {
    const fetch = vi.fn(async () =>
      new Response(JSON.stringify({id: 1, name: "Lassie"}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    );

    const api = new PetsApi({fetch});
    const {data} = await api.showPetById('1')

    expect(data).toEqual({id: 1, name: 'Lassie'})
    expect(fetch).toHaveBeenCalledWith(
      'http://petstore.swagger.io/v1/pets/1',
      expect.objectContaining({method: 'GET'}),
    )
  })
});
