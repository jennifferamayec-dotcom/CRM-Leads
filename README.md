# CRM Leads Terrenos

CRM web compartido para registrar y consultar leads desde varios dispositivos.

## Configuracion en Vercel

1. Importa este repositorio en Vercel.
2. En Vercel, abre **Storage** y crea una base **Upstash Redis** o **Vercel KV** vinculada al proyecto.
3. Comprueba que el proyecto tenga estas variables de entorno:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
4. Haz un nuevo deploy.

El frontend usa `/api/leads`. Cada lead se guarda por separado en Redis, por lo que dos usuarios pueden registrar o editar leads sin sobrescribir la lista completa. El panel consulta cambios nuevos automáticamente cada 10 segundos cuando no se esta editando un lead.

Importante: los usuarios deben abrir la URL de Vercel del proyecto. El enlace de GitHub muestra el codigo, pero no ejecuta la API `/api/leads` ni puede compartir registros.
