I have started by creating two folder in the project:
* back -> for backend and database
* front -> for frontend

Then I entered the back directory and executed:
```
npm init -y
```
This initiates npm in this directory, generates package.json (document that configures all scripts, dependencies, and dev-dependencies...) automatically with generic content to start with. I will modify this document later to add all our configurations, but every time we install a package, library or depency, it will be saved on this document.

Thanks to package.json, when you clone this repo, all you have to do is:
```
cd back
npm install
```
This will install all dependencies and dev-dependencies in package.json so you have everything you need to run the program. Dockerfile also uses this to create it's images.

Then I changed to the front directory and installed Vite. Vite demands a node version above 20.19.0, and it is a bit of a pain to update node (install curl, then nvm, then update node to latest). I installed Vite with:
```
npm install -D vite
```
Vite is a fast build tool for modern web development that bundles your code and provides a development server.
When you create a Vite project, it also generates:

* package.json - Lists your project's dependencies and scripts
* package-lock.json - Locks exact versions of dependencies for consistency
* node_modules/ - Contains all installed dependency code

These files manage your project's external libraries and ensure everyone working on the project uses the same versions

The node_modules directory should always be .gitignored, because it is very large and it is automatically created on your local repo when you run:
```
npm install
```

To run any of the two projects (front, or back), first you have to have the basic files for this projects to run "something". 
In the front we need an index.html. Vite will look for this file autoatically and launch it when you run the frontend.
Then, for the backend we need a very basic server, that will run with express (the most popular library for backend with node. We will change this to fastify later).
Express is a web server framework for Node.js that handles HTTP requests and responses.
In the back/server.ts file:

express() creates a web server
app.get('/', ...) defines what happens when someone visits your backend URL
app.listen(PORT, ...) starts the server and makes it listen for incoming requests on port 3000

When you visit http://localhost:3000/, Express receives the request, runs your route handler, and sends back "Backend is running!" as the response.

In simple terms: Express lets you easily create API endpoints that your frontend can call to send/receive data.

For the command "npm start to run in each directory" I added a script to each package.json. In the frontend I added:

"scripts": {
    "start": "npx vite"
},

This executes vite when we run npm in the front directory, because Vite was already installed (we did this earlier).

But to be able to run our backend, and for the server.ts file to actually work, first we need to install express:
```
cd back
npm install express
```
At this point a node_modules directory was also created in my backend, so I also had to create a .gitignore to ignore this very big directory.

And then later we need to install the types dev-dependency to translate or express file's typescript to javascript, because our server run javascript, not typescript. It wont work without:
```
npm install --save-dev @types/express
```
This adds our first dev-dependency to our back/package.json. For every library and dependency we install, we will have to install its @type dev-dependency to do this translation between TS and JS. Later we will configure this in a tsconfig.json file. We need to install typescript and the translator for node, typescript and ts-node:
```
npm install --save-dev typescript ts-node @types/node
```
These are also added to our dev-dependencies.

Then I added the script to the backend package.json:
"scripts": {
    "start": "ts-node server.ts"
},

This tell npm to use our server.ts file (translated with ts-node to javascript), with express.

Now you can:
```
cd back
npm start
```
Or:
```
cd front
npm start
```
This will run the projects in dev mode, and you will be able to access the backend through http://localhost:3000/ and the frontend through http://localhost:5173/

Later, when we get our docker containers working, in the container the frontend port will be 5173, but we will access it through port 8080, or 443. That is because the container exposes that port to us, and not 5173. The backend will have it's 3000 port open, the same as in dev mode.

At this point we should have a very basic front and back working, but they are not connected between eachother, because front asks nothing from back.
