/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jvalle-d <jvalle-d@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/09 22:25:02 by jvalle-d          #+#    #+#             */
/*   Updated: 2025/11/11 19:50:22 by jvalle-d         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import express from 'express';
import 'dotenv/config'; 							//Añadir soporte para la lectura de .env 

import authRoutes from './routes/auth';  			//Rutas para auth
import { hashPassword } from './middlewares/hashPassword'; //Importar función desde ruta
const app = express();
const PORT = process.env.PORT || 3000;  //Modifico para que en primer lugar intente funcionar con el puerto establecido en el .env

app.use(express.json());							  //permite recibir JSON en peticiones POST 

app.use('/auth', authRoutes);       

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.post('/testHash', hashPassword, (req, res) => {
  console.log('Password hasheado:', req.body.password);
  res.json({
    message: 'Password hasheado correctamente',
    hashedPassword: req.body.password
  });
});


app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}/`);
});

export default app;		