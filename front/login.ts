document.addEventListener("DOMContentLoaded", () => {
	const app = document.getElementById("app")!;
	app.innerHTML = `
		<form id="login-form">
			<input type="email" name="email" placeholder="Email" required />
      		<input type="password" name="password" placeholder="Password" required />
     		<button type="submit">Login</button>
		</form>
	`;
	const form = document.getElementById("login-form")!;
	form.addEventListener("submit", (e) => {
		e.preventDefault();
	});
});

