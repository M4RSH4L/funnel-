# Lo Que Mastica Tu Mascota (LQMTM)
## Funnel de Adquisición, Meta Pixel y Conversión a Primera Compra

Landing page oficial de alta conversión para la campaña del **Sorteo de 1 Año de Alimento Gratis** para perros y gatos de **Lo Que Mastica Tu Mascota (LQMTM)**.

Diseñada con una arquitectura mobile-first orientada a tráfico proveniente de Instagram Orgánico, Meta Ads (Facebook & Instagram Stories / Feed) y WhatsApp.

---

## 🚀 Características Principales

1. **Estado A (Landing de Captación):**
   - Hero con banner visual protagonista oficial y branding amarillo/rojo de LQMTM.
   - Formulario de un solo paso:
     - Nombre y Apellido con `autocomplete="name"`.
     - Nombre de la mascota.
     - Selector visual táctil de especie (**Perro / Gato**).
     - Localidad con autocompletado inteligente priorizado para AMBA (CABA y GBA) + texto libre.
     - Alimento actual con sugerencias de marcas y texto libre.
     - WhatsApp con prefijo internacional argentino `+54 9`, validación en tiempo real y normalización a estándar E.164.
     - Aceptación obligatoria de Bases y Condiciones con modal legal accesible (Ley 25.326).
     - Casilla independiente y opcional de consentimiento de marketing desmarcada por defecto.
     - Protección contra doble envío y validación exhaustiva tanto en cliente como en servidor.

2. **Estado B (Participación Confirmada y Primera Compra):**
   - Felicitación personalizada con el nombre del participante y su mascota.
   - Efecto celebratorio de confeti (`canvas-confetti`).
   - Comprobante de sorteo digital con código único `#LQMTM-XXXX`.
   - **Tarjeta de Beneficio Exclusivo de Primera Compra**:
     - 15% OFF en primer pedido.
     - Snack dental masticable de regalo.
     - Envío gratis en zonas habilitadas de AMBA.
     - Botón directo de WhatsApp con mensaje personalizado precompletado y atribución del sorteo.
   - **Carrusel horizontal de productos recomendados**:
     - Touch swipeable, autoplay suave con pausa en interacción o cambio de pestaña.
     - Botón de consulta individual por producto hacia WhatsApp.

3. **Instrumentación y Analítica de Meta Pixel & GA4:**
   - Carga dinámica y condicional de Meta Pixel (`fbq`) respetando las decisiones de consentimiento del usuario.
   - **Cero PII en eventos**: Ni nombres, teléfonos, localidades ni datos personales son transmitidos a Meta ni analítica de terceros.
   - Eventos estándar implementados:
     - `PageView`: Al ingresar a la landing.
     - `ViewContent`: Al visualizar el contenido de la campaña y productos.
     - `Lead`: Disparado **estrictamente una sola vez después de confirmar el guardado en base de datos**.
     - `Contact`: Al hacer clic en el botón de WhatsApp comercial.
   - Eventos internos de embudo:
     - `form_start`, `form_validation_error`, `form_submit`, `registration_success`, `registration_error`, `whatsapp_click`, `product_view`, `product_whatsapp_click`.
   - **Atribución de Campaña**:
     - Captura y preservación de parámetros UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`) a lo largo de todo el funnel.

4. **Panel de Analítica y CRO (Métricas de Campaña):**
   - Accesible desde el botón "Métricas" en la cabecera.
   - Tasa de Conversión (Visita → Lead).
   - Tasa de Finalización (Formularios iniciados → Lead).
   - Tasa de Contacto (Leads → Clic WhatsApp).
   - Desglose por Especie (Perros vs Gatos), Top Localidades, Alimentos Actuales y Fuentes de Tráfico UTM.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express (y Route Handler compatible con Next.js App Router).
- **Persistencia:** Prisma ORM, compatible con PostgreSQL (Vercel Postgres, Supabase, Neon) y almacenamiento persistente local para desarrollo.
- **Validación:** Módulo desacoplado de normalización y validación con pruebas unitarias (`node:test`).

---

## 📦 Instalación y Ejecución Local

1. Clonar el repositorio e instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Completar `VITE_META_PIXEL_ID` o `NEXT_PUBLIC_META_PIXEL_ID` con tu ID de Pixel de Meta Events Manager.

3. Ejecutar los tests unitarios:
   ```bash
   npx tsx --test src/utils/phone.test.ts
   npx tsx --test src/utils/analytics.test.ts
   ```

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

---

## 🗄️ Configuración de Base de Datos PostgreSQL

### En Vercel / Supabase / Neon:

1. Crear una base de datos PostgreSQL en [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), Supabase o Neon.
2. Copiar la variable de conexión `DATABASE_URL` en tu archivo `.env` o en las variables de entorno de tu proyecto en Vercel:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```
3. Generar el cliente de Prisma y ejecutar las migraciones:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

El esquema incluye:
- Restricción de unicidad: `unique_participant_phone_campaign` (`[phoneNormalized, termsVersion]`) para impedir registros duplicados de un mismo teléfono en una misma edición del sorteo.
- Registro auditable de fecha y hora del consentimiento de marketing independiente.
- Campos de atribución de campaña (`utmSource`, `utmCampaign`, etc.).

---

## 🌐 Despliegue en Vercel (Next.js)

1. Conectar tu repositorio de GitHub a Vercel.
2. En la configuración de variables de entorno de Vercel, añadir:
   - `NEXT_PUBLIC_META_PIXEL_ID`: Tu ID de Meta Pixel (ej. `123456789012345`).
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`: El número comercial de WhatsApp (ej. `+5491136458899`).
   - `DATABASE_URL`: La URL de PostgreSQL provista por Vercel Postgres o Supabase.
3. Desplegar. El endpoint de registro se encuentra listo en `src/app/api/register/route.ts`.

---

## 🎯 Guía de Configuración en Meta Events Manager

1. Entrar a [Meta Events Manager (Administrador de Eventos)](https://business.facebook.com/events_manager2).
2. Seleccionar el Pixel correspondiente o crear uno nuevo.
3. En la pestaña **Configuración**, copiar el **Identificador del píxel** y pegarlo en `NEXT_PUBLIC_META_PIXEL_ID`.
4. Ir a la pestaña **Probar eventos** (Test Events).
5. Ingresar la URL de tu landing (`https://tudominio.com`) y hacer clic en **Abrir sitio web**.
6. Realizar las siguientes acciones para verificar el registro de eventos:
   - **PageView & ViewContent:** Deben dispararse automáticamente al cargar la landing.
   - **Completar formulario:** Al enviar el formulario con datos válidos, debe registrarse el evento **Lead** una sola vez. Si se refresca la página o se intenta enviar nuevamente, no debe duplicarse.
   - **Clic en WhatsApp:** Al presionar "Consultar mi beneficio por WhatsApp", debe registrarse el evento **Contact**.

---

## ✅ Checklist de Pruebas Previas a la Inversión Publicitaria

- [x] Banner visual y logo de LQMTM visibles en desktop y mobile.
- [x] Selector Perro/Gato responde al toque y persiste la especie.
- [x] Campo WhatsApp valida correctamente números de CABA (11), Gran Buenos Aires e interior con prefijo argentino (+54 9).
- [x] Envío bloqueado si falta aceptar Bases y Condiciones.
- [x] Casilla de publicidad por WhatsApp desmarcada por defecto.
- [x] No permite registros duplicados con el mismo teléfono.
- [x] Pantalla de confirmación muestra el nombre del dueño y de la mascota.
- [x] Clic a WhatsApp abre conversación con mensaje precompletado con nombre de mascota y código.
- [x] Carrusel de productos se desliza con el dedo y permite consultar por cada producto.
- [x] Parámetros UTM se capturan desde la URL (`?utm_source=instagram&...`) y se asocian al registro.
- [x] Ningún dato personal (nombre, teléfono, localidad) viaja en los parámetros del Pixel de Meta.
