# API REST con Node.js, Express y MongoDB

Este proyecto es una API REST construida con **Node.js**, **Express** y **MongoDB** usando **Mongoose** como ODM (Object Document Mapper). Sirve como introducción práctica al mundo de las bases de datos NoSQL, modelando un dominio simple: plataformas de streaming y sus series con episodios.

---

## Tabla de contenidos

- [¿Qué es NoSQL y por qué MongoDB?](#qué-es-nosql-y-por-qué-mongodb)
- [Conceptos clave antes de empezar](#conceptos-clave-antes-de-empezar)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Los schemas de Mongoose](#los-schemas-de-mongoose)
- [Cómo se conecta la app a MongoDB](#cómo-se-conecta-la-app-a-mongodb)
- [Endpoints de la API](#endpoints-de-la-api)
- [Ejemplos de uso con curl](#ejemplos-de-uso-con-curl)
- [Mongo Express: interfaz visual de la base de datos](#mongo-express-interfaz-visual-de-la-base-de-datos)
- [Glosario](#glosario)

---

## ¿Qué es NoSQL y por qué MongoDB?

Las bases de datos **relacionales** (SQL) organizan la información en tablas con filas y columnas, y exigen que la estructura esté definida de antemano. Son muy sólidas para datos con relaciones fijas y bien conocidas.

Las bases de datos **NoSQL** ("Not Only SQL") son una familia de tecnologías que abandonan el modelo tabular para ofrecer más flexibilidad. MongoDB en particular es una base de datos **orientada a documentos**: en lugar de filas en tablas, guarda **documentos JSON** dentro de **colecciones**.

| Concepto SQL | Concepto MongoDB |
|---|---|
| Base de datos | Base de datos |
| Tabla | Colección |
| Fila / Registro | Documento |
| Columna | Campo |
| JOIN | `$lookup` o `populate()` |
| Schema rígido | Schema flexible (opcional) |

### ¿Por qué usar MongoDB?

- Los documentos representan naturalmente objetos del mundo real (una serie tiene capítulos, un carrito tiene productos).
- Se adapta bien cuando la estructura de los datos cambia con el tiempo.
- Escala horizontalmente con facilidad.
- Usa JSON (o su variante binaria BSON), el formato más popular en aplicaciones web.

---

## Conceptos clave antes de empezar

### Documento

Es la unidad básica de datos en MongoDB. Es un objeto JSON. Por ejemplo, una plataforma de streaming sería:

```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0d",
  "nombre": "Netflix",
  "activa": true
}
```

El campo `_id` lo genera MongoDB automáticamente y es el **identificador único** del documento. Es de tipo `ObjectId`, un valor hexadecimal de 24 caracteres.

### Colección

Agrupa documentos del mismo tipo. Es el equivalente a una tabla. Este proyecto tiene dos colecciones: `plataformas` y `series`.

### Documento embebido (Embedded Document)

MongoDB permite guardar objetos anidados dentro de un documento. En este proyecto, los **capítulos** no viven en una colección propia sino **dentro de cada serie**:

```json
{
  "titulo": "Breaking Bad",
  "capitulos": [
    { "titulo": "Piloto", "duracion": 58, "numero": 1 },
    { "titulo": "Gato en el techo caliente", "duracion": 48, "numero": 2 }
  ]
}
```

Esto se llama **modelo desnormalizado** y es uno de los patrones más importantes de MongoDB: si siempre accedés a los capítulos junto con su serie, tiene sentido guardarlos juntos en el mismo documento en vez de en una tabla separada.

### Referencia entre documentos

El otro patrón es guardar una **referencia** al `_id` de otro documento, equivalente a una clave foránea en SQL. En este proyecto, cada serie guarda el `_id` de su plataforma:

```json
{
  "titulo": "Stranger Things",
  "plataforma": "664f1a2b3c4d5e6f7a8b9c0d"
}
```

### Mongoose y los Schemas

MongoDB por sí solo no exige ninguna estructura. **Mongoose** es una librería que corre del lado de Node.js y permite definir **schemas**: reglas sobre qué campos tiene cada documento, de qué tipo son, cuáles son obligatorios, etc. Actúa como una capa de validación y organización sobre la base de datos.

---

## Arquitectura del proyecto

```
apiMongoV1/
├── src/
│   ├── app.js              ← Servidor Express y definición de todos los endpoints
│   ├── db.js               ← Lógica de conexión a MongoDB
│   ├── plataformaSchema.js ← Schema y modelo de Plataforma
│   └── serieSchema.js      ← Schema y modelo de Series (con capítulos embebidos)
├── docker-compose.yml      ← Levanta MongoDB y Mongo Express con Docker
└── package.json
```

El proyecto tiene una estructura intencionalmente plana para facilitar la comprensión. Todos los endpoints viven en `app.js`, y cada modelo tiene su propio archivo.

**Flujo de una request:**

```
Cliente (curl / Postman / navegador)
        ↓  HTTP Request
    app.js  (Express recibe la request y ejecuta el handler)
        ↓
    serieSchema.js / plataformaSchema.js  (Mongoose valida y arma la query)
        ↓
    MongoDB  (ejecuta la operación y devuelve el resultado)
        ↓  respuesta JSON
    Cliente
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para correr MongoDB sin instalarlo manualmente)

Para verificar que están instalados:

```bash
node --version
docker --version
```

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <url-del-repo>
cd apiMongoV1
npm install
```

### 2. Levantar MongoDB con Docker

```bash
docker-compose up -d
```

Este comando levanta dos servicios:

- **MongoDB** en el puerto `27017` con usuario `admin` y contraseña `admin1234`.
- **Mongo Express** en el puerto `8081`, una interfaz web para explorar la base de datos visualmente.

> El flag `-d` (detached) hace que los contenedores corran en segundo plano sin bloquear la terminal.

Para verificar que los contenedores están corriendo:

```bash
docker-compose ps
```

Para detenerlos cuando ya no los necesitás:

```bash
docker-compose down
```

### 3. Iniciar la API

```bash
npm run dev
```

Deberías ver en la consola:

```
Conexión a mongo con éxito
App iniciada
```

La API queda disponible en `http://localhost:3000`.

---

## Los schemas de Mongoose

### Plataforma (`src/plataformaSchema.js`)

```js
const plataformaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  activa: { type: Boolean, required: true },
});
```

Representa una plataforma de streaming. Campos:

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | String | Sí | Nombre de la plataforma (ej: "Netflix") |
| `activa` | Boolean | Sí | Si la plataforma está operativa |

### Series (`src/serieSchema.js`)

```js
const seriesSchema = new mongoose.Schema({
  plataforma: { type: mongoose.Schema.Types.ObjectId, ref: "Plataforma" },
  titulo:     { type: String, required: true },
  temporada:  { type: Number, required: true },
  genero:     { type: String },
  capitulos: [
    {
      titulo:      { type: String, required: true },
      duracion:    { type: Number },
      numero:      { type: Number },
      descripcion: { type: String },
    },
  ],
});
```

Representa una temporada de una serie. Campos:

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `plataforma` | ObjectId | No | Referencia al `_id` de una Plataforma |
| `titulo` | String | Sí | Título de la serie |
| `temporada` | Number | Sí | Número de temporada |
| `genero` | String | No | Género (drama, comedia, etc.) |
| `capitulos` | Array | No | Lista de capítulos embebidos |

Cada elemento del array `capitulos`:

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `titulo` | String | Sí | Título del capítulo |
| `duracion` | Number | No | Duración en minutos |
| `numero` | Number | No | Número dentro de la temporada |
| `descripcion` | String | No | Sinopsis breve |

> **Nota sobre `ref: "Plataforma"`**: este valor le dice a Mongoose que cuando hagamos un `populate()` sobre el campo `plataforma`, debe buscar en la colección del modelo llamado `"Plataforma"`. Es el mecanismo que permite "resolver" referencias entre documentos.

---

## Cómo se conecta la app a MongoDB

El archivo `src/db.js` exporta una función `connectToDatabase()` que Mongoose usa para establecer la conexión:

```js
const MONGO_URL =
  process.env.MONGO_URL ||
  "mongodb://admin:admin1234@localhost:27017/seriesMongo?authSource=admin";

const connectToDatabase = async () => {
  mongoose.set("strictQuery", false);
  await mongoose.connect(MONGO_URL);
};
```

Partes de la URL de conexión:

```
mongodb://  admin  :  admin1234  @  localhost  :  27017  /  seriesMongo  ?authSource=admin
   │          │           │            │            │           │                │
protocolo  usuario    contraseña     host         puerto    base de datos    dónde están
                                                                              los usuarios
```

- **`seriesMongo`** es el nombre de la base de datos. MongoDB la crea automáticamente la primera vez que se insertan datos.
- **`authSource=admin`** indica que las credenciales del usuario están almacenadas en la base de datos `admin` (el comportamiento por defecto del contenedor Docker).
- La URL puede sobreescribirse con la variable de entorno `MONGO_URL` para usar una instancia diferente (ej: MongoDB Atlas en la nube).

En `app.js`, la conexión se establece **antes** de que el servidor empiece a escuchar:

```js
async function startServer() {
  await connectToDatabase(); // primero conectamos
  app.listen(3000, () => {   // recién después abrimos el puerto
    console.log("App iniciada");
  });
}
```

Esto garantiza que ninguna request llegue antes de que la base de datos esté disponible.

---

## Endpoints de la API

### Plataformas

#### `GET /plataforma` — Listar todas las plataformas

Devuelve un array con todos los documentos de la colección `plataformas`.

**Respuesta exitosa `200 OK`:**
```json
[
  { "_id": "664f1a2b...", "nombre": "Netflix", "activa": true },
  { "_id": "664f1a3c...", "nombre": "Disney+", "activa": true }
]
```

---

#### `POST /plataforma` — Crear una plataforma

Recibe un JSON en el body y crea un nuevo documento en la colección.

**Body requerido:**
```json
{
  "nombre": "HBO Max",
  "activa": true
}
```

**Respuesta exitosa `201 Created`:**
```json
{
  "_id": "664f2d4e...",
  "nombre": "HBO Max",
  "activa": true,
  "__v": 0
}
```

> El campo `__v` es un versionKey que Mongoose agrega automáticamente para control interno de versiones del documento.

---

### Series

#### `GET /series` — Listar todas las series

Devuelve todas las series. El campo `plataforma` viene **populado**: en vez del `_id` crudo, trae el `nombre` de la plataforma correspondiente.

Internamente, Mongoose ejecuta dos queries: primero busca las series, luego busca las plataformas referenciadas y reemplaza los `ObjectId` con los documentos reales (solo el campo `nombre`).

**Respuesta exitosa `200 OK`:**
```json
[
  {
    "_id": "665a1b2c...",
    "titulo": "Breaking Bad",
    "temporada": 1,
    "genero": "Drama",
    "plataforma": { "_id": "664f1a2b...", "nombre": "Netflix" },
    "capitulos": []
  }
]
```

---

#### `POST /series` — Crear una serie (sin vincular a plataforma)

Crea una serie con los datos del body. El campo `plataforma` es opcional; si se incluye, debe ser un `ObjectId` válido.

**Body de ejemplo:**
```json
{
  "titulo": "Breaking Bad",
  "temporada": 1,
  "genero": "Drama"
}
```

---

#### `POST /series/:plataforma` — Crear una serie vinculada a una plataforma

El parámetro `:plataforma` es el `_id` de una plataforma existente. El endpoint primero busca esa plataforma y luego crea la serie vinculada a ella.

```
POST /series/664f1a2b3c4d5e6f7a8b9c0d
```

**Body de ejemplo:**
```json
{
  "titulo": "Stranger Things",
  "temporada": 1,
  "genero": "Ciencia ficción"
}
```

**Respuesta exitosa `201 Created`:**
```json
{
  "_id": "665b3c4d...",
  "plataforma": "664f1a2b3c4d5e6f7a8b9c0d",
  "titulo": "Stranger Things",
  "temporada": 1,
  "genero": "Ciencia ficción",
  "capitulos": []
}
```

---

#### `POST /series/:serieId/capitulo` — Agregar un capítulo a una serie

Agrega un capítulo al array `capitulos` del documento de serie indicado. Usa el operador de MongoDB **`$push`** para insertar un elemento en el array sin reemplazar los existentes.

```
POST /series/665b3c4d.../capitulo
```

**Body de ejemplo:**
```json
{
  "titulo": "Piloto",
  "duracion": 58,
  "numero": 1,
  "descripcion": "Walter White descubre que tiene cáncer y decide cocinar metanfetamina."
}
```

**Respuesta exitosa `201 Created`** (devuelve solo el capítulo recién agregado):
```json
{
  "_id": "665c4d5e...",
  "titulo": "Piloto",
  "duracion": 58,
  "numero": 1,
  "descripcion": "Walter White descubre que tiene cáncer y decide cocinar metanfetamina."
}
```

> **¿Por qué `$push` y no simplemente guardar el array completo?** Porque en un entorno real con múltiples usuarios concurrentes, enviar el array completo podría pisar los cambios que otro usuario hizo en el mismo instante. `$push` es una operación atómica: MongoDB la ejecuta de forma segura sin importar cuántas requests lleguen al mismo tiempo.

---

## Ejemplos de uso con curl

Podés probar todos los endpoints desde la terminal. Reemplazá los `_id` que aparecen como ejemplo por los que devuelva tu propia base de datos.

```bash
# 1. Crear una plataforma
curl -X POST http://localhost:3000/plataforma \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Netflix", "activa": true}'

# 2. Listar plataformas (copiá el _id que devuelve para usarlo abajo)
curl http://localhost:3000/plataforma

# 3. Crear una serie vinculada a esa plataforma
curl -X POST http://localhost:3000/series/REEMPLAZAR_CON_ID_PLATAFORMA \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Breaking Bad", "temporada": 1, "genero": "Drama"}'

# 4. Listar series con la plataforma populada
curl http://localhost:3000/series

# 5. Agregar un capítulo (usá el _id de la serie que devolvió el paso 3)
curl -X POST http://localhost:3000/series/REEMPLAZAR_CON_ID_SERIE/capitulo \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Piloto", "duracion": 58, "numero": 1}'
```

---

## Mongo Express: interfaz visual de la base de datos

Con los contenedores corriendo, accedé a `http://localhost:8081` en el navegador. Mongo Express es una aplicación web que permite explorar las colecciones y documentos de MongoDB sin necesidad de escribir queries.

Desde ahí podés:

- Ver los documentos creados por la API tal como los almacena MongoDB.
- Inspeccionar los `ObjectId` generados automáticamente.
- Observar cómo se ven los capítulos embebidos dentro del documento de la serie.
- Editar o eliminar documentos manualmente para experimentar.

Es una herramienta muy útil para entender visualmente lo que está pasando en la base de datos mientras desarrollás.

---

## Glosario

| Término | Definición |
|---|---|
| **NoSQL** | Categoría de bases de datos que no usan el modelo relacional de tablas. MongoDB, Redis y Cassandra son ejemplos. |
| **Documento** | Objeto JSON que representa un registro en MongoDB. |
| **Colección** | Conjunto de documentos, equivalente a una tabla en SQL. |
| **ObjectId** | Tipo de dato de MongoDB para identificadores únicos, generados automáticamente. Tiene 24 caracteres hexadecimales. |
| **Schema (Mongoose)** | Definición de la estructura esperada de un documento: campos, tipos y validaciones. |
| **Modelo (Mongoose)** | Clase generada a partir de un schema que permite interactuar con una colección (crear, buscar, actualizar, eliminar). |
| **Documento embebido** | Objeto anidado dentro de otro documento. Los capítulos de una serie son documentos embebidos. |
| **Referencia** | Campo que guarda el `_id` de otro documento en lugar del documento completo. Equivale a una clave foránea. |
| **populate()** | Método de Mongoose que reemplaza una referencia (`ObjectId`) con el documento real al que apunta. |
| **`$push`** | Operador de MongoDB que agrega un elemento a un array de forma atómica sin modificar los elementos existentes. |
| **ODM** | Object Document Mapper. Librería que mapea documentos MongoDB a objetos JavaScript. Mongoose es un ODM. |
| **BSON** | Binary JSON. El formato interno que usa MongoDB para almacenar documentos. Es más eficiente que JSON texto pero funcionalmente equivalente. |
| **`authSource`** | Parámetro de la URL de conexión que indica en qué base de datos están almacenadas las credenciales del usuario. |
