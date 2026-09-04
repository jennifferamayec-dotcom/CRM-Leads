const { Redis } = require('@upstash/redis');

const LEADS_KEY = 'terrenos-crm-leads-v2';
const LEGACY_LEADS_KEY = 'terrenos-crm-leads';

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
      const storedLeads = await redis.hgetall(LEADS_KEY);
      let leads = Object.values(storedLeads || {}).map((lead) => {
        try {
          return typeof lead === 'string' ? JSON.parse(lead) : lead;
        } catch (error) {
          return null;
        }
      }).filter(Boolean);

      if (leads.length === 0) {
        const legacyLeads = await redis.get(LEGACY_LEADS_KEY);
        if (Array.isArray(legacyLeads)) {
          leads = legacyLeads.filter((lead) => lead && typeof lead.id === 'string');
          if (leads.length > 0) {
            await redis.hset(LEADS_KEY, Object.fromEntries(
              leads.map((lead) => [lead.id, JSON.stringify(lead)])
            ));
          }
        }
      }
      return sendJson(response, 200, { leads });
    }

    if (request.method === 'POST') {
      const payload = typeof request.body === 'string'
        ? JSON.parse(request.body)
        : request.body;
      const lead = payload && payload.lead;

      if (!lead || typeof lead.id !== 'string') {
        return sendJson(response, 400, { error: 'El lead debe tener un id válido.' });
      }

      await redis.hset(LEADS_KEY, { [lead.id]: JSON.stringify(lead) });
      return sendJson(response, 200, { ok: true, lead });
    }

    if (request.method === 'DELETE') {
      const id = request.query && request.query.id;
      if (!id) return sendJson(response, 400, { error: 'Falta el id del lead.' });
      await redis.hdel(LEADS_KEY, id);
      return sendJson(response, 200, { ok: true });
    }

    response.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(response, 405, { error: 'Método no permitido.' });
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, { error: 'No se pudo acceder al almacenamiento cloud.' });
  }
};
