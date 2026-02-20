In this branch I have created a Makefile to:
- build our project
- create neccessary folders in our local computers to save the volumes (persistent data)
- run containers using .env file. The .env file will never be uploaded to github, so I have created an example file .env.example, so we know which env variables we need to create eacxh time we clone the repo and don't have the .env file. We must create a new .env file each time we clone this repo for our program to work. I also .gitignored the .env file

The Makefile will also:
- stop and remove any unused images or containers when we execute make clean
- it will delete everything, all folders, volumes, containers, images (a nuclear bomb) with make fclean

I have added build scripts to the package.json of front and back directories. This is used by their Dockerfiles, which are used by the docker-compose.yml file, which is used by the Makefile.

I also created a file called tsconfig.json in the back dir, that tells TypeScript how to compile your code and is neccessary for our back/Dockerfile.

We need to know the difference now between development and production:

- In development we are running our project locally and we can start our project without using docker. All we have to do is type:
	```
	cd back
	npm install
	npm start
	```

	OR
	```
	cd back
	npm install
	npm start
	```
	* This will run each part of our program independently, without using docker.

- In development, but using docker to run our full project to see how it will work in production mode. For this we nned the .env file with all it's variables (at least the ones needed by Makefile and docker-compose.yaml). Once we have .env file, we must type:
	```
	make
	```

	OR
	```
	docker-compose up -d
	```
	* This is almost doing the same. The only difference is that 'make' creates the folders in your local PC for the volumes, while docker-compose up just builds and runs the containers.

- In production, our project will be built and run by the server using our container set-up but without Makefile, and it will stay that way as long as we want and pay for. It will be available to any user of the internet, and it will be a working web-site "producing" on the internet!


If you execute make and you already have a MariaDb instance running:
Remove it: docker rm -f mariadb
Or rename it: docker rename mariadb mariadb_old

If your backend port is allready allocated:
make fclean
or:
docker rm -f trascendence-backend (backend container)