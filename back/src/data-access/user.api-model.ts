import { Role } from "../user-session.js";

// Esta inerfaz marca qué formato tiene que tener el objeto User cuando lo mandamos del back hacia el front
export interface ApiUser { // nunca se pasa la password a la api
	id: string;
	username: string;
	email: string;
	// role: Role; hay que ver si al final va a hacer falta el rol de admin
}