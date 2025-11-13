document.addEventListener("DOMContentLoaded", () => {
	const app = document.getElementById("app")!;
	app.innerHTML = `
		 <div class="login-container">
            <h1>Sign in to Transcendence</h1>
            <button id="google-login" type="button">Continue with Google</button>
            <button id="github-login" type="button">Continue with Github</button>
			<span>or</span>
            <form id="login-form">
                <input type="email" id="login-email" name="email" placeholder="EMAIL" required/>
                <input type="password" id="login-password" name="password" placeholder="PASSWORD" required/>
                <button type="submit">Log in</button>
            </form>
            <a href="#" id="reset-password">Reset password</a>
            <p>No account? <a href="#" id="create-account">Create one</a></p>
        </div>
	`;

	// ##################### SIGN UP  
	const new_account = document.getElementById("create-account")!;
	new_account.addEventListener("click", (e) =>{
		e.preventDefault();
		createAccount();
	});
	function createAccount()
	{
		app.innerHTML = `
		<div class="create-container">
			<h1>Welcome to Transcendence</h1>
			<button id="google-login" type="button">Continue with Google</button>
			<span>or</span>
			<form id="create-form">
				<input type="email" id="signup-email" name="email" placeholder="EMAIL" required/>
                <input type="password" id="signup-password" name="password" placeholder="PASSWORD" required/>
				<input type="text" id="username" name="username" placeholder="USERNAME" required/>
                <button type="submit">Sign Up</button>
			</form>
		</div>
		`;
		const signup = document.getElementById("create-form")!;
		signup.addEventListener("submit", (e) =>{
			e.preventDefault();
			const signup_email = (document.getElementById("signup-email") as HTMLInputElement).value;
			const signup_password = (document.getElementById("signup-password") as HTMLInputElement).value;
			const signup_username = (document.getElementById("username") as HTMLInputElement).value;
			
			console.log(signup_email, signup_password, signup_username);
		});
	}

	/// ################### LOG IN 
	const form = document.getElementById("login-form")!;
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const login_email = (document.getElementById("login-email") as HTMLInputElement).value;
		const login_password = (document.getElementById("login-password") as HTMLInputElement).value;

		console.log(login_email, login_password);
	});
});
