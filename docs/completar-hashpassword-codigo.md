# Completar hashPassword.ts - Paso a Paso

## Tu código actual:

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

export const hashPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Tu código aquí ← AQUÍ tienes que escribir
    // generar salt
    // hashear password
    // reemplazar req.body.password
    // llamar next()
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
};
```

---

## Ahora completa el try con estos pasos:

### PASO 1: Verificar si existe password

```typescript
// Si no hay password, continuar sin hacer nada
if (!req.body.password) {
  return next();
}
```

**¿Por qué?** No todas las peticiones tienen password, solo queremos hashear si existe.

---

### PASO 2: Obtener el password del body

```typescript
const password = req.body.password;
```

**Guardamos el password en una variable para trabajar con él.**

---

### PASO 3: Generar el salt

```typescript
const salt = await bcrypt.genSalt(10);
```

**¿Qué hace?**
- `bcrypt.genSalt(10)` → genera un salt aleatorio
- `10` → número de rounds (más alto = más seguro pero más lento)
- `await` → espera a que se genere (es asíncrono)

---

### PASO 4: Hashear el password con el salt

```typescript
const hashedPassword = await bcrypt.hash(password, salt);
```

**¿Qué hace?**
- `bcrypt.hash(password, salt)` → combina password + salt y genera el hash
- `await` → espera a que se genere el hash
- Guarda el resultado en `hashedPassword`

---

### PASO 5: Reemplazar el password original con el hash

```typescript
req.body.password = hashedPassword;
```

**¿Qué hace?**
Reemplaza el password original ("123456") con el hash ("$2b$10$...")

Ahora cuando tu ruta reciba `req.body.password`, tendrá el hash, no el password original.

---

### PASO 6: Continuar al siguiente middleware/ruta

```typescript
next();
```

**¿Qué hace?**
Le dice a Express: "Ya terminé mi trabajo, continúa con lo siguiente"

---

## Código completo que debes tener:

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

export const hashPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // PASO 1: Verificar si existe password
    if (!req.body.password) {
      return next();
    }

    // PASO 2: Obtener el password
    const password = req.body.password;

    // PASO 3: Generar salt
    const salt = await bcrypt.genSalt(10);

    // PASO 4: Hashear el password
    const hashedPassword = await bcrypt.hash(password, salt);

    // PASO 5: Reemplazar el password original
    req.body.password = hashedPassword;

    // PASO 6: Continuar
    next();

  } catch (error) {
    res.status(500).json({ error: 'Error al hashear el password' });
  }
};
```

---

## Opcional: Añadir console.log para debugging

Mientras aprendes, es útil ver qué está pasando:

```typescript
try {
  if (!req.body.password) {
    return next();
  }

  const password = req.body.password;

  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(password, salt);

  req.body.password = hashedPassword;

  next();

} catch (error) {
  console.error('Error en hashPassword:', error);
  res.status(500).json({ error: 'Error al hashear el password' });
}
```

**Los console.log te permitirán ver en la terminal qué está pasando en cada paso.**

---

## Resumen de lo que hace cada función de bcrypt:

```typescript
// Genera texto aleatorio (salt)
const salt = await bcrypt.genSalt(10);
// Resultado: "$2b$10$N9qo8uLOickgx2ZMRZoMye"

// Combina password + salt → hash
const hash = await bcrypt.hash("123456", salt);
// Resultado: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

**El hash incluye el salt dentro, por eso es tan largo.**

---

## Tu tarea ahora:

**Completa tu archivo `/back/middlewares/hashPassword.ts` con el código completo.**

Puedes copiar el código que te di arriba, pero asegúrate de **entender cada línea**.

---

**Cuando lo tengas completo, avísame y lo probamos en Postman.** 🚀
