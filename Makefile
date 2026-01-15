NAME = trascendence

all:
	@printf "Building and setting configuration for ${NAME}...\n"
	@docker compose -f docker-compose.yml up -d --build

down:
	@printf "Stopping ${NAME}\n"
	@docker compose -f docker-compose.yml down

clean: down
	@printf "Stopping and cleaning up all docker configurations of ${NAME}."
	@docker system prune -a

fclean:
	@printf "Cleaning all configuration of ${NAME} and all volumes and host data...\n"
	@if [ -n "$$(docker ps -qa)" ]; then docker stop $$(docker ps -qa); fi
	@docker system prune --all --force --volumes
	@docker network prune --force
	@docker volume prune --force
	@docker image prune --all --force
	@docker container prune --force
	@docker builder prune --all --force
	@if [ -n "$$(docker volume ls -q)" ]; then docker volume rm $$(docker volume ls -q); fi

re:	clean all

.PHONY	: all build down re clean fclean