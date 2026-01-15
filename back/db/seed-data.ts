/**
 * seed-data.ts - Datos de prueba para la base de datos
 * 
 * Inserta usuarios de prueba en la base de datos.
 * Se ejecuta automáticamente al iniciar la aplicación si la tabla está vacía.
 */

import { pool } from '../db/database.js';
import bcrypt from 'bcrypt';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Datos de usuarios de prueba
 */
const seedUsers = [
    {
        username: 'admin',
        email: 'admin@transcendence.com',
        password: 'admin123'
    },
    {
        username: 'testuser',
        email: 'test@transcendence.com',
        password: 'test123'
    },
    {
        username: 'player',
        email: 'player@transcendence.com',
        password: 'player123'
    }
];

/**
 * Verifica si la tabla de usuarios está vacía
 */
const isUsersTableEmpty = async (): Promise<boolean> => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM users'
    );
    return rows[0].count === 0;
};

/**
 * Inserta los datos de prueba en la base de datos
 */
export const seedDatabase = async (): Promise<void> => {
    try {
        // Solo hacer seed si la tabla está vacía
        const isEmpty = await isUsersTableEmpty();
        
        if (!isEmpty) {
            console.log('⚠ La tabla users ya contiene datos, omitiendo seed');
            return;
        }

        console.log('📦 Insertando datos de prueba...');

        // Insertar cada usuario
        for (const user of seedUsers) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);

            await pool.execute<ResultSetHeader>(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [user.username, user.email, hashedPassword]
            );
        }

        console.log(`✓ ${seedUsers.length} usuarios de prueba insertados`);
        console.log('  Credenciales disponibles:');
        seedUsers.forEach(u => {
            console.log(`    - ${u.email} / ${u.password}`);
        });

    } catch (error) {
        console.error('✗ Error al insertar datos de prueba:', error);
        throw error;
    }
};
