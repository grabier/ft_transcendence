# ¿Qué es "process" en Node.js?

## Respuesta corta:

`process` es un **objeto global** que Node.js te da automáticamente. 

**No tienes que importarlo, no tienes que crearlo, simplemente existe.**

---

## ¿De dónde sale?

### Cuando ejecutas tu servidor:

```bash
npm start
# o
node server.js
```

**Node.js automáticamente crea el objeto `process`** que contiene información sobre el proceso que está corriendo.

Es como si Node.js dijera:
> "Hola, soy Node.js. Aquí tienes un objeto `process` con toda la info del programa que estás ejecutando"

---

## ¿Qué contiene `process`?

El objeto `process` tiene MUCHA información:

```typescript
process.env          // Variables de entorno (.env)
process.argv         // Argumentos con los que se ejecutó
process.cwd()        // Directorio actual
process.exit()       // Cerrar el programa
process.pid          // ID del proceso
process.platform     // Sistema operativo (linux, win32, darwin)
process.version      // Versión de Node.js
```

### Para nosotros, lo importante es:

```typescript
process.env  // Acceso a las variables de entorno
```

---

## Analogía del mundo real:

Imagina que `process` es como **la información del conductor de un coche**:

```javascript
// Cuando arrancas el coche (Node.js), automáticamente tienes:
conductor.nombre          // "Juan"
conductor.edad            // 25
conductor.licencia        // "123ABC"
conductor.preferencias    // { música: "rock", temperatura: 22 }
                         //  ↑ esto es como process.env
```

**No necesitas crear `conductor`, el coche te lo da automáticamente cuando arrancas.**

En Node.js es lo mismo:
- Arrancas el programa → Node.js crea `process`
- `process.env` → tus configuraciones personales (del archivo .env)

---

## ¿Por qué se llama "process"?

En sistemas operativos, cada programa que se ejecuta es un **proceso** (process).

Cuando ejecutas:
```bash
npm start
```

El sistema operativo crea un **proceso** para tu aplicación Node.js.

Node.js te da acceso a información de ese proceso mediante el objeto `process`.

---

## Ejemplo práctico:

### Tu archivo `.env`:
```env
JWT_SECRET=abc123
PORT=3000
NOMBRE_APP=MiBackend
```

### Cuando Node.js carga tu aplicación:

```typescript
// Node.js automáticamente crea:
process.env = {
  JWT_SECRET: "abc123",
  PORT: "3000",
  NOMBRE_APP: "MiBackend",
  // ... y muchas más variables del sistema
}
```

### Entonces puedes usar:

```typescript
console.log(process.env.PORT);        // "3000"
console.log(process.env.JWT_SECRET);  // "abc123"
console.log(process.env.NOMBRE_APP);  // "MiBackend"
```

---

## ¿Necesitas importar `process`?

**NO**

```typescript
// ❌ NO necesitas hacer esto:
import process from 'algo';

// ✅ Simplemente úsalo:
const puerto = process.env.PORT;
```

`process` es un **objeto global**, como `console` o `setTimeout`:

```typescript
console.log("Hola");    // No importas console, simplemente existe
setTimeout(() => {}, 1000);  // No importas setTimeout, simplemente existe
process.env.PORT        // No importas process, simplemente existe
```

---

## ¿Cómo llegan las variables del .env a process.env?

Aquí es donde entra **dotenv**:

### Sin dotenv:
```typescript
console.log(process.env.JWT_SECRET);  // undefined
```
Node.js no sabe nada del archivo `.env`

### Con dotenv:
```typescript
import 'dotenv/config';  // ← Esta línea lee el .env

console.log(process.env.JWT_SECRET);  // "abc123"
```

**¿Qué hace `dotenv/config`?**
1. Lee el archivo `.env`
2. Toma cada línea: `JWT_SECRET=abc123`
3. La añade a `process.env.JWT_SECRET`

---

## Diagrama completo:

```
1. Creas archivo .env
   ┌─────────────────┐
   │ PORT=3000       │
   │ JWT_SECRET=xyz  │
   └─────────────────┘
           │
           │
2. import 'dotenv/config'  ← Lee el archivo
           │
           ▼
3. Las variables se añaden a process.env
   ┌──────────────────────────┐
   │ process.env = {          │
   │   PORT: "3000",          │
   │   JWT_SECRET: "xyz",     │
   │   ... otras del sistema  │
   │ }                        │
   └──────────────────────────┘
           │
           │
4. Tú las usas en tu código
   ┌──────────────────────────────────┐
   │ const PORT = process.env.PORT;   │
   │ const SECRET = process.env.JWT_  │
   │              SECRET;              │
   └──────────────────────────────────┘
```

---

## Otros ejemplos de uso de process:

```typescript
// Saber en qué sistema operativo corres
console.log(process.platform);  // "linux", "darwin" (Mac), "win32"

// Cerrar el programa con código de error
process.exit(1);  // 1 = error, 0 = éxito

// Saber qué versión de Node usas
console.log(process.version);  // "v20.11.0"

// Directorio donde se ejecuta el programa
console.log(process.cwd());  // "/home/user/proyecto/back"
```

---

## Resumen en 3 puntos:

1. **`process`** es un objeto global que Node.js crea automáticamente
2. **`process.env`** contiene las variables de entorno
3. **`dotenv`** lee tu archivo `.env` y añade las variables a `process.env`

---

## Para recordar:

```typescript
process.env.PORT
│       │   └── Nombre de tu variable (del archivo .env)
│       └────── Objeto con todas las variables de entorno
└────────────── Objeto global de Node.js (info del proceso)
```

---

**¿Ahora tiene más sentido de dónde sale `process`?**

Es como `console.log()` - no lo creas, Node.js te lo da automáticamente.

**¿Listo para crear el primer middleware ahora? 🚀**
