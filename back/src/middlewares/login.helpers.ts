import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';


/* En este archivo habría que incluir la función que verifica el JWT token

y

constantes, si las hubiera

y

la funcion de hasheo de contraseña, que ya la tenemos en principio:*/


/* Interfaz para que TypeScript sepa que el body puede tener password.
	Sin esto, TS se quejará diciendo que "password" no existe en 'unknown'.
*/
interface UserBody {
	password?: string;
	[key: string]: any; // Permitir otras propiedades (username, email, etc)
}

export const hashPassword = async (
	request: FastifyRequest<{ Body: UserBody }>, //Tipamos el Body
	reply: FastifyReply
) => {
	try {
		if (!request.body || !request.body.password) {
			return;//equivale a return next
		}
		//console.log(req.body.password);
		const password = request.body.password;
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		request.body.password = hashedPassword;
		//console.log(req.body.password);

	} catch (error) {
		request.log.error(error); // Usamos el logger integrado
		return reply.code(500).send({ error: 'Error al hashear la contraseña' });
	}
};
