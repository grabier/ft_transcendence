/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   hashPassword.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jvalle-d <jvalle-d@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/09 23:11:47 by jvalle-d          #+#    #+#             */
/*   Updated: 2025/11/11 19:50:44 by jvalle-d         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

export const hashPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
	if(!req.body.password){
		return next();
	}
	//console.log(req.body.password);
	const password = req.body.password;
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	req.body.password = hashedPassword;
	//console.log(req.body.password);
	next();

  } catch (error) {
    res.status(500).json({ error: 'Error al hashear la contraseña' });
  }
};