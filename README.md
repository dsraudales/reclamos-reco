# Recepción de Fotografías

Aplicación Next.js lista para desplegar en Vercel con:

- Formulario público con `Nombre completo`, `Número/Código del cliente`, `Teléfono` y `Correo` opcionales.
- Carga de hasta `10` imágenes por solicitud.
- Subida directa a Supabase Storage mediante URLs firmadas.
- Registro y gestión de solicitudes en Supabase.
- Panel administrativo autenticado con Supabase Auth.

## Stack

- `Next.js 16` + App Router
- `Supabase Auth` para acceso interno
- `Supabase Postgres` para solicitudes y metadata
- `Supabase Storage` para almacenamiento de imágenes

## Variables de entorno

Duplica `.env.example` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
SUPABASE_STORAGE_UPLOAD_PREFIX=solicitudes
ADMIN_EMAILS=admin@institucion.gob.hn
```

`ADMIN_EMAILS` puede contener varios correos separados por coma. También se acepta acceso si el usuario en Supabase tiene `role=admin` en `app_metadata` o `user_metadata`.

## Base de datos

Ejecuta [supabase/schema.sql](/C:/Users/David%20Raudales/Projects/forms-reclamos-reco/supabase/schema.sql) en el SQL Editor de Supabase.

Las tablas creadas son:

- `public.submissions`
- `public.submission_files`

Las políticas RLS quedan cerradas para `anon` y `authenticated`, porque toda la lectura y escritura se hace del lado servidor usando la `service role key`.

## Supabase Storage

1. Crea un bucket privado en Supabase Storage.
2. Usa el nombre de ese bucket en `SUPABASE_STORAGE_BUCKET`.
3. Opcionalmente define un prefijo como `solicitudes` en `SUPABASE_STORAGE_UPLOAD_PREFIX`.

La aplicación usa:

- URLs firmadas de subida generadas del lado servidor.
- URLs firmadas de descarga para el panel admin.
- Supabase Storage privado para que los archivos no queden expuestos públicamente.

## Usuarios internos

1. Crea usuarios en `Supabase Auth`.
2. Asegúrate de que el correo esté incluido en `ADMIN_EMAILS`.
3. Opcionalmente, asigna `role=admin` en los metadatos del usuario.

## Desarrollo local

```bash
npm install
npm run dev
```

La app pública queda en [http://localhost:3000](http://localhost:3000) y el panel administrativo en [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

## Despliegue en Vercel

1. Importa el proyecto en Vercel.
2. Configura las variables de entorno del archivo `.env.example`.
3. Crea el bucket privado en Supabase Storage.
4. Despliega.

## Rutas principales

- `/` formulario público
- `/admin/login` acceso interno
- `/admin` listado de solicitudes
- `/admin/submissions/[id]` detalle, descarga y gestión

## Notas de arquitectura

- Las imágenes no pasan por el servidor de Vercel; se suben directo a Supabase Storage para evitar límites de payload.
- Supabase almacena solo metadata, estado y notas internas.
- Los enlaces de descarga se generan al vuelo y expiran automáticamente.
