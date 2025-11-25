import { loadGame } from './game.js';
function createElement(
    tag: string, 
    className: string = "", 
    attributes: Record<string, string> = {}, 
    children: (HTMLElement | SVGElement | string)[] = []
): HTMLElement {
    const element = document.createElement(tag);
    if (className) element.className = className;
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    return element;
}

function createIcon(iconId: string, className: string = "w-5 h-5"): SVGElement {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    
    if (className) svg.setAttribute("class", className);

    const use = document.createElementNS(svgNS, "use");
    use.setAttribute("href", `./assets/sprites.svg#${iconId}`); 
    
    svg.appendChild(use);
    return svg;
}


document.addEventListener("DOMContentLoaded", () => {
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
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const login_email = (document.getElementById("login-email") as HTMLInputElement).value;
            const login_password = (document.getElementById("login-password") as HTMLInputElement).value;
            console.log("LOGIN DATA: ", login_email, login_password);
			loadGame();
        });

        const new_account = document.getElementById("create-account")!;
        new_account.addEventListener("click", (e) => {
            e.preventDefault();
            SignUp();
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
        if(backLogin) {
            backLogin.addEventListener("click", (e) => {
                e.preventDefault();
                Login();
            });
        }
    }
    Login();
});