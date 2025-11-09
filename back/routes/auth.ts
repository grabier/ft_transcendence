/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jvalle-d <jvalle-d@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/09 22:57:18 by jvalle-d          #+#    #+#             */
/*   Updated: 2025/11/09 22:57:21 by jvalle-d         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Router } from 'express';  // ← Importas Router, NO app

const router = Router();  // ← Creas un router

router.post('/register', (req, res) => {
  // tu código
});

router.post('/login', (req, res) => {
  // tu código
});

export default router;  // ← Exportas el router