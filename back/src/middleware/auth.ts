import { FastifyReply, FastifyRequest } from "fastify";

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        // Esto verifica el token automáticamente usando el secreto de server.ts
        await req.jwtVerify();
    } catch (err) {
        reply.code(401).send({ error: "Acceso denegado: Token inválido" });
    }
};