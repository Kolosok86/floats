.PHONY: docker
docker-recreate:
	docker compose up -d --build --force-recreate --no-deps
docker:
	docker compose up -d --build
