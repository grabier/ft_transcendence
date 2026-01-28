import { useState } from 'react';

// Definimos la interfaz basándonos en tu SELECT de user.api.ts
interface User {
  id: number;
  username: string;
  email: string;
}

export const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    // 1. Recuperamos el token de donde lo hayáis guardado
    const token = sessionStorage.getItem('auth_token');

    if (!token) {
      setError("No hay token. Por favor, inicia sesión.");
      return;
    }

    try {
      // 2. Petición al endpoint /api/user
      const response = await fetch('http://localhost:3000/api/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // El prefijo que espera jwtVerify
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el hook authenticate falló, devolverá un 401
        throw new Error(data.error || 'Error al cargar usuarios');
      }

      // 3. Guardamos los datos de la tabla users
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setUsers([]);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <button onClick={fetchUsers} style={{ cursor: 'pointer' }}>
        Obtener Usuarios (Request al Back)
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.username}</strong> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default UserList;