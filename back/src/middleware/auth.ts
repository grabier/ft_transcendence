import { FastifyReply, FastifyRequest } from "fastify";

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
	try {
		await req.jwtVerify();
	} catch (err) {
		reply.code(401).send({ error: "Access denied: Invalid token" });
	}
};