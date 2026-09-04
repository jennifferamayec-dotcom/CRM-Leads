# CRM Leads Terrenos

CRM web compartido para registrar y consultar leads desde varios dispositivos.

## Configuracion en Vercel

1. Importa este repositorio en Vercel.
2. En Vercel, abre **Storage** y crea una base **Upstash Redis** o **Vercel KV** vinculada al proyecto.
3. Comprueba que el proyecto tenga estas variables de entorno:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
4. Haz un nuevo deploy.

El frontend usa `/api/leads`. Los registros se guardan en Redis y todos los usuarios del despliegue comparten la misma lista. El panel consulta cambios nuevos automáticamente cada 10 segundos cuando no se esta editando un lead.
