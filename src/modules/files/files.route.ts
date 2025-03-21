import { asRoute } from '../../common/typings';
import { Boom } from '@hapi/boom';

export default asRoute(async function (app) {
  app.route({
    url: '/',
    method: 'GET',
    handler() {
      throw new Boom('Not implemented', {
        statusCode: 501,
      });
    },
  });
});
