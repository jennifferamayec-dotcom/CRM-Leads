const { Redis } = require('@upstash/redis');

const LEADS_KEY = 'terrenos-crm-leads';

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function getRedis() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('Faltan KV_REST_API_URL y KV_REST_API_TOKEN.');
  }
  return Redis.fromEnv();
}

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  try {
    const redis = getRedis();

    if (request.method === 'GET') {
      const leads = (await redis.get(LEADS_KEY)) || [];
      return sendJson(response, 200, { leads: Array.isArray(leads) ? leads : [] });
    }

    if (request.method === 'PUT') {
      const payload = typeof request.body === 'string'
        ? JSON.parse(request.body)
        : request.body;
      const leads = payload && payload.leads;

      if (!Array.isArray(leads)) {
        return sendJson(response, 400, { error: 'El campo leads debe ser un arreglo.' });
      }

      await redis.set(LEADS_KEY, leads);
      return sendJson(response, 200, { ok: true, leads });
    }

    response.setHeader('Allow', 'GET, PUT');
    return sendJson(response, 405, { error: 'Método no permitido.' });
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, { error: 'No se pudo acceder al almacenamiento cloud.' });
  }
};
