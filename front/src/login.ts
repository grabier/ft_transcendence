import { loadGame } from './game.js';
import { Homepage } from './homepage.js';
import { createElement } from './tools.js';
import { createIcon } from './tools.js';

document.addEventListener("DOMContentLoaded", () =>	{
	const app = document.getElementById("app")!;

	function Login() {
		app.innerHTML = '';

		const loginContainer = createElement('div', 'login-container', {}, [
			createElement('div', 'auth-card fade-in', {}, [
				createElement('div', 'auth-title', {}, [
					createElement('p', '', {}, ['Sign in to']),
					createElement('h1', '', {}, ['Transcendence']),
				]),

				createElement('button', 'btn-oauth-dark', { id: 'google-login', type: 'button' }, [
					createIcon('icon-google'),
					'Continue with Google'
				]),

				createElement('button', 'dev-button', { id: 'dev-homepage-btn', type: 'button'}, ['Dev Button Homepage']),

				createElement('button', 'btn-oauth-dark mt-4 mb-6', { id: 'github-login', type: 'button' }, [
					createIcon('icon-github'),
					'Continue with Github'
				]),

				createElement('form', '', { id: 'login-form' }, [
					createElement('input', '', { type: 'email', id: 'login-email', name: 'email', placeholder: 'EMAIL', required: 'true' }),
					createElement('input', '', { type: 'password', id: 'login-password', name: 'password', placeholder: 'PASSWORD', required: 'true' }),

					createElement('button', 'btn-primary', { type: 'submit' }, ['Log in'])
				]),

				createElement('a', 'auth-link', { href: '#', id: 'reset-password' }, ['Reset password']),

				createElement('p', '', {}, [
					'No account? ',
					createElement('a', 'auth-link-gradient', { href: '#', id: 'create-account' }, ['Create one'])
				])
			])
		]);

		app.appendChild(loginContainer);

		const form = document.getElementById("login-form")!;
		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			const login_email = (document.getElementById("login-email") as HTMLInputElement).value;
			const login_password = (document.getElementById("login-password") as HTMLInputElement).value;
			console.log("LOGIN DATA: ", login_email, login_password);

			try {
				const response = await fetch("http://localhost:3000/api/auth/login", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email: login_email, password: login_password }),
				});
				
				const data = await response.json();
				console.log("DATA: ", data);
				if (response.ok) {
					// ✅ Login exitoso - navegar al juego
					console.log("Login exitoso:", data.user);
					loadGame();
				} else {
					// ⚠️ Error del servidor (401, 400, etc.)
					alert(data.error || "Error al iniciar sesión");
				}
			} catch (error) {
				// ❌ Error de red/conexión (servidor caído, sin internet, etc.)
				console.error("Error al iniciar sesión:", error);
				alert("Error de conexión. Verifica que el servidor esté activo.");
			}
		
		});

		const devBtn = document.getElementById("dev-homepage-btn");
		if (devBtn) {
			devBtn.addEventListener("click", (e) => {
				e.preventDefault();
				Homepage();
			});
		}

		function SignUp() {
		app.innerHTML = '';

		const createContainer = createElement('div', 'create-container', {}, [
			createElement('div', 'auth-card fade-in', {}, [
				createElement('div', 'auth-title', {}, [
					createElement('p', '', {}, ['Welcome to']),
					createElement('h1', '', {}, ['Transcendence']),
				]),

				createElement('button', 'btn-oauth-dark mb-6', { id: 'google-login', type: 'button' }, [
					createIcon('icon-google'),
					'Continue with Google'
				]),

				createElement('form', '', { id: 'create-form' }, [
					createElement('input', '', { type: 'email', id: 'signup-email', name: 'email', placeholder: 'EMAIL', required: 'true' }),
					createElement('input', '', { type: 'password', id: 'signup-password', name: 'password', placeholder: 'PASSWORD', required: 'true' }),
					createElement('input', '', { type: 'text', id: 'username', name: 'username', placeholder: 'USERNAME', required: 'true' }),

					createElement('button', 'btn-primary', { type: 'submit' }, ['Sign Up'])
				]),

				createElement('p', '', {}, [
					'Already have an account? ',
					createElement('a', 'auth-link-gradient', { href: '#', id: 'back-to-login' }, ['Log in'])
				])
			])
		]);

		app.appendChild(createContainer);

		const signup = document.getElementById("create-form")!;
		signup.addEventListener("submit", (e) => {
			e.preventDefault();
			const signup_email = (document.getElementById("signup-email") as HTMLInputElement).value;
			const signup_password = (document.getElementById("signup-password") as HTMLInputElement).value;
			const signup_username = (document.getElementById("username") as HTMLInputElement).value;

			console.log("SIGN UP DATA:", signup_email, signup_password, signup_username);
		});

		const backLogin = document.getElementById("back-to-login");
		if (backLogin) {
			backLogin.addEventListener("click", (e) => {
				e.preventDefault();
				Login();
			});
		}
	}
		const new_account = document.getElementById("create-account")!;
		new_account.addEventListener("click", (e) => {
			e.preventDefault();
			SignUp(); //import
		});
	}
	Login();
});