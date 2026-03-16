# Discussion on how to solve the challenge

IMPORTANT: this file is a suggestion of how to solve the challenge, not the final solution. The final solution should be in the code files, and the agent must discuss with this file not take it as the ultimate truth.

## Visión general de la arquitectura

El sistema tiene tres piezas bien separadas:

Backend: Cloudflare Worker con Hono + Drizzle ORM conectado a Neon Postgres
Frontend: React + TypeScript + TailwindCSS + TanStack Query
Respuesta escrita: las tres preguntas de producción


## Backend — Decisiones de diseño

### Estructura del proyecto

Lo más limpio para un Worker con Hono es algo así:
worker/
  src/
    index.ts          # entry point, registra las rutas
    middleware/
      auth.ts         # valida Bearer token, setea tenant en contexto
      rateLimit.ts    # rate limiting in-memory para POST /tasks
    routes/
      tasks.ts        # GET, POST, DELETE
    db/
      schema.ts       # tabla tasks con Drizzle
      client.ts       # conexión a Neon
  drizzle.config.ts
  wrangler.toml

### Autenticación y contexto de tenant

El middleware de auth lee el header Authorization: Bearer <token>, lo mapea a un tenant, y lo inyecta en el contexto de Hono (c.set('tenant', 'tenant_a')). Así todas las rutas downstream saben a qué tenant pertenece el request sin volver a mirar el token.
Los tokens hardcodeados van en variables de entorno del Worker (no en el código), lo que es más limpio y simula cómo sería en producción.
Aislamiento de tenant a nivel de query
Cada query de Drizzle incluye .where(eq(tasks.tenantId, tenant)) — nunca se hace un SELECT sin filtrar por tenant. Esto es la clave de seguridad. El DELETE además verifica que el id pertenezca al tenant antes de borrar (no solo filtra por id).
Rate limiting in-memory
Para el Worker se puede usar un Map simple con ventana de tiempo (ej: máx 10 POSTs por minuto por tenant). Hay que tener en cuenta que los Workers de Cloudflare pueden tener múltiples instancias, así que el in-memory es "por instancia" — eso es aceptable para el challenge y vale la pena mencionarlo en el README.

### Schema Drizzle

typescripttasks: {
  id: uuid (PK, default random)
  title: text (not null)
  status: text (enum: 'pending' | 'done')
  tenant_id: text (not null)
  created_at: timestamp (default now)
}
```

---

## Frontend — Decisiones de diseño

**Estructura**
```
frontend/
  src/
    components/
      TenantSelector.tsx
      TaskList.tsx
      TaskForm.tsx
      TaskItem.tsx
    hooks/
      useTasks.ts       # useQuery para GET /tasks
      useCreateTask.ts  # useMutation para POST
      useDeleteTask.ts  # useMutation para DELETE
    lib/
      api.ts            # fetch helpers con el token correcto
    App.tsx
    
### Manejo del tenant seleccionado

El estado del tenant vive en App.tsx y se pasa hacia abajo. Al cambiar de tenant, TanStack Query invalida el cache automáticamente porque la query key incluye el tenant (['tasks', selectedTenant]). Esto evita que se vean tareas del tenant anterior.
El api.ts

Centraliza la URL base y el token. Recibe el tenant como parámetro y sabe qué token usar. Así los hooks quedan limpios.

## Respuesta escrita — Cómo encararlo

Las tres preguntas son de "pensamiento de producción":

DMARC/DKIM en Cloudflare: explicar qué hace cada uno (DKIM firma el email, DMARC define política de qué hacer si falla), y cómo se configuran como registros DNS en Cloudflare (TXT records). Mencionar que Cloudflare Email Routing facilita parte de esto.

Debug de data leak entre tenants: metodología sistemática — revisar logs, reproducir el bug, buscar queries sin filtro de tenant, revisar si hay algún endpoint que no pase por el middleware de auth. El fix es agregar el filtro a nivel de query y un test de integración que lo verifique.

Backup de Neon Postgres: Neon tiene branching y point-in-time recovery built-in. Para backup adicional se puede usar pg_dump desde un Cloudflare Worker scheduled (cron trigger) o GitHub Actions, y guardar en R2 o S3. Verificación: restaurar en una branch de Neon y correr una query de sanity check.