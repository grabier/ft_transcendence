import "fastify";

declare module "fastify" {
  export interface FastifyRequest {
    user: {
      id: number;
      username: string;
      email: string;
    };
  }
}