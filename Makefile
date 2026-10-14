.PHONY: api-install api-run api-test api-lint web-install web-dev up down logs reset-db seed

api-install:
	cd api && python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt

api-run:
	cd api && .venv/bin/uvicorn app.main:app --reload

api-test:
	cd api && .venv/bin/pytest -q

api-lint:
	cd api && .venv/bin/ruff check .

web-install:
	cd web && npm install

web-dev:
	cd web && npm run dev

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

reset-db:
	docker compose down -v

seed:
	docker compose exec api python -m app.seed
