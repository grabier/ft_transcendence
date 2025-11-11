# Explicación: Router en Express

## La línea:
```typescript
import { Router } from 'express';
const router = Router();
```

---

## ¿Qué es Router?

**`Router` es como un "mini-app" para organizar tus rutas.**

Es una forma de agrupar rutas relacionadas en archivos separados, en lugar de ponerlas todas en `server.ts`.

---

## Problema que resuelve:

### SIN Router (todo en server.ts):

```typescript
// server.ts - TODO junto, desorganizado ❌
const app = express();

app.post('/auth/register', (req, res) => { /* ... */ });
app.post('/auth/login', (req, res) => { /* ... */ });
app.get('/auth/profile', (req, res) => { /* ... */ });

app.get('/products/list', (req, res) => { /* ... */ });
app.post('/products/create', (req, res) => { /* ... */ });
app.delete('/products/delete', (req, res) => { /* ... */ });

app.get('/users/list', (req, res) => { /* ... */ });
app.post('/users/create', (req, res) => { /* ... */ });

// 100 rutas más...
// ¡Un desastre! 😱
```

### CON Router (organizado):

```
back/
├── server.ts
└── routes/
    ├── auth.ts      ← Rutas de autenticación
    ├── products.ts  ← Rutas de productos
    └── users.ts     ← Rutas de usuarios
```

---

## Comparación: app vs router

### `app` (el servidor principal):
```typescript
const app = express();  // Crea el servidor completo
app.listen(3000);       // Puede iniciar el servidor
```

### `router` (mini-servidor para organizar):
```typescript
const router = Router();  // Crea un mini-app para rutas
// NO puede hacer .listen()
// Solo agrupa rutas
```

---

## Ejemplo práctico:

### Archivo: `routes/auth.ts`
```typescript
import { Router } from 'express';

const router = Router();  // ← Creas un mini-app

// Defines rutas SIN el prefijo /auth
router.post('/register', (req, res) => {
  res.send('Ruta de registro');
});

router.post('/login', (req, res) => {
  res.send('Ruta de login');
});

router.get('/profile', (req, res) => {
  res.send('Ruta de perfil');
});

export default router;  // ← Exportas el router
```

### Archivo: `server.ts`
```typescript
import express from 'express';
import authRoutes from './routes/auth';

const app = express();

// Montas el router con el prefijo /auth
app.use('/auth', authRoutes);
//       └─┬──┘  └────┬────┘
//         │          └── El router con las rutas
//         └───────────── Prefijo para todas las rutas del router

app.listen(3000);
```

---

## ¿Cómo funcionan las URLs?

Con el código anterior, las rutas quedan así:

```
Prefijo en server.ts  +  Ruta en router  =  URL final
      /auth          +     /register      =  /auth/register
      /auth          +     /login         =  /auth/login
      /auth          +     /profile       =  /auth/profile
```

**Desde Postman:**
```
POST http://localhost:3000/auth/register
POST http://localhost:3000/auth/login
GET  http://localhost:3000/auth/profile
```

---

## Analogía del mundo real:

### Imagina un centro comercial:

**`app` = El centro comercial completo**
- Tiene la entrada principal
- Administra todo el edificio

**`router` = Una sección del centro comercial**
- Sección de ropa
- Sección de comida
- Sección de electrónica

```typescript
// Centro comercial (server.ts)
const centroComercial = express();

// Sección de ropa (routes/ropa.ts)
const seccionRopa = Router();
seccionRopa.get('/camisas', ...);
seccionRopa.get('/pantalones', ...);

// Montas la sección en el centro comercial
centroComercial.use('/ropa', seccionRopa);

// URLs finales:
// /ropa/camisas
// /ropa/pantalones
```

---

## ¿Por qué usar Router?

### Ventajas:

1. **Organización:** Cada grupo de rutas en su propio archivo
2. **Reutilización:** Puedes usar el mismo router en diferentes lugares
3. **Mantenimiento:** Más fácil encontrar y modificar rutas
4. **Trabajo en equipo:** Cada persona puede trabajar en un archivo diferente

### Sin Router:
```typescript
// server.ts - 500 líneas, imposible de mantener
app.post('/auth/register', ...);
app.post('/auth/login', ...);
app.get('/products/list', ...);
app.post('/products/create', ...);
// ... 100 rutas más
```

### Con Router:
```typescript
// server.ts - Limpio y organizado ✅
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);

// routes/auth.ts - Solo rutas de auth ✅
// routes/products.ts - Solo rutas de productos ✅
// routes/users.ts - Solo rutas de usuarios ✅
```

---

## Diferencias entre app y router:

| Característica | app | router |
|----------------|-----|--------|
| Se crea con | `express()` | `Router()` |
| Puede hacer `.listen()` | ✅ Sí | ❌ No |
| Puede tener rutas | ✅ Sí | ✅ Sí |
| Puede tener middlewares | ✅ Sí | ✅ Sí |
| Se exporta/importa | ❌ No (se queda en server.ts) | ✅ Sí |
| Propósito | Servidor principal | Organizar rutas |

---

## Ejemplo completo con múltiples routers:

### `server.ts`:
```typescript
import express from 'express';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';

const app = express();
app.use(express.json());

// Montar routers
app.use('/auth', authRoutes);      // /auth/*
app.use('/products', productRoutes); // /products/*

app.listen(3000);
```

### `routes/auth.ts`:
```typescript
import { Router } from 'express';

const router = Router();

router.post('/register', (req, res) => {
  res.send('Register');
});

router.post('/login', (req, res) => {
  res.send('Login');
});

export default router;
```

### `routes/products.ts`:
```typescript
import { Router } from 'express';

const router = Router();

router.get('/list', (req, res) => {
  res.send('Product list');
});

router.post('/create', (req, res) => {
  res.send('Create product');
});

export default router;
```

### URLs resultantes:
```
/auth/register      ← De auth router
/auth/login         ← De auth router
/products/list      ← De products router
/products/create    ← De products router
```

---

## Importación con llaves { }:

```typescript
import { Router } from 'express';
//     └───┬───┘
//         └── Con llaves = "named export"
```

**¿Por qué las llaves?**

Express exporta `Router` como un "named export" (exportación nombrada), no como default.

```typescript
// Dentro de express:
export { Router };  // Named export

// Por eso lo importas con llaves:
import { Router } from 'express';

// Si fuera default export:
export default Router;

// Lo importarías sin llaves:
import Router from 'express';
```

---

## Resumen visual:

```
server.ts (app principal)
    │
    ├── app.use('/auth', authRoutes)
    │        │              │
    │        │              └── routes/auth.ts (Router)
    │        │                      ├── /register
    │        │                      ├── /login
    │        │                      └── /profile
    │        │
    │        └── Prefijo que se añade a todas las rutas
    │
    └── app.use('/products', productRoutes)
                 │              │
                 │              └── routes/products.ts (Router)
                 │                      ├── /list
                 │                      └── /create
                 │
                 └── Prefijo para estas rutas
```

---

## Resumen en 3 puntos:

1. **`Router`** es una clase de Express para crear mini-apps de rutas
2. **Se usa** para organizar rutas en archivos separados
3. **Se monta** en el app principal con `app.use(prefijo, router)`

---

## Conclusión:

```typescript
import { Router } from 'express';
const router = Router();
```

**"Tráeme la herramienta Router de Express y crea un organizador de rutas"**

Es como decir: "Dame una carpeta para organizar documentos relacionados"

---

**¿Más claro ahora? Router = organizador de rutas**
