# Explicación: app.use(express.json())

## La línea:
```typescript
app.use(express.json());
```

---

## ¿Qué hace esta línea?

**Permite que Express entienda JSON en el body de las peticiones HTTP.**

Sin esta línea, cuando alguien envía JSON desde Postman o el frontend, `req.body` estaría **vacío** o **undefined**.

---

## Desglosemos la línea:

```typescript
app.use(express.json());
│   │   │       │
│   │   │       └── Función que parsea (convierte) JSON
│   │   └────────── Objeto express con utilidades
│   └────────────── Método para aplicar middlewares globales
└────────────────── Tu aplicación Express
```

---

## ¿Qué significa "parsear JSON"?

### Cuando Postman/Frontend envía datos:

**Lo que viaja por internet (texto plano):**
```
"{"email":"juan@test.com","password":"123456"}"
```
↑ Esto es un STRING (texto)

**Lo que tú quieres en tu código (objeto JavaScript):**
```javascript
{
  email: "juan@test.com",
  password: "123456"
}
```
↑ Esto es un OBJETO (puedes hacer `req.body.email`)

**`express.json()` hace la conversión automáticamente.**

---

## Ejemplo SIN express.json():

### Tu código:
```typescript
// ❌ SIN express.json()
const app = express();

app.post('/login', (req, res) => {
  console.log(req.body);  // undefined o {}
  console.log(req.body.email);  // undefined
  res.send('Recibido');
});
```

### Desde Postman envías:
```json
{
  "email": "juan@test.com",
  "password": "123456"
}
```

### Lo que recibes:
```typescript
req.body = undefined  // ❌ No funciona
```

**Problema:** Express no sabe cómo leer el JSON del body.

---

## Ejemplo CON express.json():

### Tu código:
```typescript
// ✅ CON express.json()
const app = express();
app.use(express.json());  // ← ESTA LÍNEA

app.post('/login', (req, res) => {
  console.log(req.body);  // { email: "juan@test.com", password: "123456" }
  console.log(req.body.email);  // "juan@test.com"
  console.log(req.body.password);  // "123456"
  res.send('Recibido correctamente');
});
```

### Desde Postman envías:
```json
{
  "email": "juan@test.com",
  "password": "123456"
}
```

### Lo que recibes:
```typescript
req.body = {
  email: "juan@test.com",
  password: "123456"
}  // ✅ Funciona perfectamente
```

---

## ¿Qué es app.use()?

`app.use()` aplica un **middleware global** que se ejecuta en TODAS las peticiones.

```typescript
app.use(express.json());
//      └── Este middleware se ejecuta ANTES de cualquier ruta
```

**Orden de ejecución:**

```
1. Llega petición POST /login
         ↓
2. Se ejecuta express.json() ← Parsea el body
         ↓
3. Se ejecuta tu ruta app.post('/login', ...)
         ↓
4. Respondes al cliente
```

---

## Analogía del mundo real:

Imagina un restaurante:

### SIN express.json() (sin traductor):
```
Cliente extranjero: "我想要披萨" (chino)
Mesero: "No entiendo" 😕
```

### CON express.json() (con traductor):
```
Cliente extranjero: "我想要披萨" (chino)
   ↓
Traductor automático: "Quiere una pizza"
   ↓
Mesero: "¡Entendido! Una pizza" ✅
```

**`express.json()` es el traductor que convierte JSON (texto) en objetos JavaScript.**

---

## Otros tipos de parsers:

Express tiene diferentes "traductores" para diferentes formatos:

```typescript
// Para JSON (lo que usamos)
app.use(express.json());

// Para datos de formularios HTML (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Para texto plano
app.use(express.text());

// Para datos raw (binarios)
app.use(express.raw());
```

**Para tu proyecto (JWT y auth), solo necesitas `express.json()`**

---

## ¿Cuándo se usa express.json()?

### ✅ Necesitas express.json() cuando:

- Recibes datos POST/PUT con JSON en el body
- Tu frontend envía `fetch()` con `Content-Type: application/json`
- Usas Postman enviando JSON
- Cualquier API que reciba/envíe JSON

### ❌ NO necesitas express.json() cuando:

- Solo tienes rutas GET (no hay body en GET)
- Recibes datos por URL query params (`?email=test@test.com`)
- Solo sirves archivos estáticos (HTML, CSS, imágenes)

---

## Ejemplo completo del flujo:

### Cliente (Postman):
```http
POST http://localhost:3000/register
Content-Type: application/json

{
  "email": "juan@test.com",
  "password": "123456"
}
```

### Servidor (Node.js):
```typescript
const app = express();
app.use(express.json());  // ← Parsea el JSON automáticamente

app.post('/register', (req, res) => {
  // Ahora puedes acceder a los datos:
  const email = req.body.email;      // "juan@test.com"
  const password = req.body.password; // "123456"
  
  console.log(`Registrando: ${email}`);
  res.json({ success: true });
});
```

---

## ¿Dónde se pone?

**Debe ir ANTES de definir tus rutas:**

```typescript
// ✅ CORRECTO
const app = express();
app.use(express.json());  // PRIMERO el middleware

app.post('/login', (req, res) => {  // DESPUÉS las rutas
  console.log(req.body);  // Funciona
});

// ❌ INCORRECTO
const app = express();

app.post('/login', (req, res) => {  // Ruta ANTES del middleware
  console.log(req.body);  // undefined
});

app.use(express.json());  // Muy tarde, la ruta ya se definió
```

---

## Resumen en 3 puntos:

1. **`express.json()`** convierte texto JSON en objetos JavaScript
2. **`app.use()`** lo aplica a TODAS las peticiones
3. **Sin esto**, `req.body` estará vacío cuando envíes JSON

---

## Para tu proyecto:

Cuando hagas peticiones POST para:
- **Register:** `req.body.email` y `req.body.password`
- **Login:** `req.body.email` y `req.body.password`

**Sin `express.json()` → No funcionaría nada**  
**Con `express.json()` → Todo funciona perfectamente ✅**

---

## Visualización final:

```
POSTMAN envía JSON (texto):     '{"email":"juan@test.com"}'
                                         ↓
app.use(express.json())          [ TRADUCTOR ]
                                         ↓
Tu código recibe objeto:         { email: "juan@test.com" }
                                         ↓
Puedes usar:                     req.body.email
```

---

## Conclusión

`app.use(express.json())` es como poner un traductor automático antes de que lleguen los datos a tu código.

**Es esencial para cualquier API que reciba JSON.**
