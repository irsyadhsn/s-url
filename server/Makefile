include .env

.PHONY: postgres
postgres:
	docker exec -it surlvibe-postgres  psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
