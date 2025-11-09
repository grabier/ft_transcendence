/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jvalle-d <jvalle-d@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/09 22:25:02 by jvalle-d          #+#    #+#             */
/*   Updated: 2025/11/09 23:00:27 by jvalle-d         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import express from 'express';
import 'dotenv/config'; 							//Añadir soporte para la lectura de .env 

import authRoutes from './routes/auth';  			//

const app = express();
const PORT = process.env.PORT || 3000;				//Modifico para que en primer lugar intente funcionar con el puerto establecido en el .env

app.use(express.json());							//permite recibir JSON en peticiones POST 

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});


app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}/`);
});

export default app;								    //