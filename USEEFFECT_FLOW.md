# 📊 Flujo Cronológico de useEffects

## 🚀 CARGA INICIAL (F5 o primer acceso)

```
TIEMPO 0ms → Renders React
├─ Frontend.tsx MONTA
│  ├─ useEffect 1: Busca token en URL (?token=xxx) → localStorage ✅
│  └─ useEffect 2: Configura beforeunload listener
│
├─ SocketContext MONTA
│  └─ useEffect: Conecta WebSocket (pero token aún no está en localStorage) ❌
│
└─ Header.tsx MONTA
   ├─ lastTokenRef.current = null
   └─ useEffect: checkToken() 
      ├─ Lee localStorage → SÍ HAY TOKEN (del F5 anterior)
      ├─ Decodifica JWT → setUser ✅
      └─ Polling cada 500ms (esperando cambios futuros)
```

---

## 🔐 LOGIN OAUTH (GitHub redirecciona)

```
TIEMPO 0ms → Usuario clickea "Continue with GitHub"
│
├─ GitHub → Backend → Frontend (redirecciona a /?token=xxx)
│
└─ React NO remonta (misma URL, solo parámetro nuevo)
   ├─ Frontend.tsx YA ESTÁ MONTADO
   │  └─ useEffect NO vuelve a ejecutarse (dependencia [])
   │     ❌ NO procesa el nuevo token de la URL
   │
   ├─ SocketContext YA ESTÁ MONTADO
   │  └─ useEffect NO vuelve a ejecutarse
   │     ❌ Sigue sin token autenticado
   │
   └─ Header.tsx YA ESTÁ MONTADO
      └─ useEffect NO vuelve a ejecutarse
         ✅ PERO el polling cada 500ms DETECTA el cambio en localStorage
            └─ setUser + fetch persistence
```

---

## ❓ ¿POR QUÉ ESTÁ DISTRIBUIDO ASÍ?

### ✅ **Frontend.tsx procesa el token de URL**
- Razón: Es la raíz. Llega PRIMERO a procesar parámetros de OAuth
- Frontend DEBE guardar el token en localStorage antes de que Header lo lea

### ✅ **Header.tsx hace polling para detectar cambios**
- Razón: Header no sabe cuándo va a llegar un nuevo token
- El polling cada 500ms es lo que permite detectar cuando GitHub redirecciona
- Si fuera solo un useEffect al montar, nunca se enteraría del nuevo token

### ❌ **SocketContext tiene el mismo problema (bug latente)**
```jsx
// SocketContext CONECTA al montar
useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (!token) return; // ← Si no hay token, no conecta
  connect(); // ← Pero Header sí tiene token después del polling
}, []); // ← No detecta el cambio cuando Header lo carga

// RESULTADO: WebSocket nunca se autentica después de OAuth
```

---

## 🔧 SOLUCIÓN PARA SocketContext

```jsx
// Igual que Header: agregar polling
useEffect(() => {
  const connect = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    // ... crear WebSocket
  };

  connect(); // Al montar
  const interval = setInterval(connect, 500); // Polling
  
  return () => clearInterval(interval);
}, []);
```

---

## 📌 RESUMEN: ORDEN CORRECTO

```
1️⃣ Frontend.tsx → Procesa URL y guarda token en localStorage
2️⃣ Header.tsx → Lee localStorage (polling) y carga usuario
3️⃣ SocketContext → Debería también hacer polling para reconectarse con token
4️⃣ Otros componentes → Pueden usar usuario/socket cargados
```

**El polling es temporal pero funciona. Lo ideal a futuro: Un Context global que maneje el usuario y notifique a todos cuando cambia.**
