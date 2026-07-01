# To-Do API — Backend (Django + DRF)

API REST de lista de tarefas com autenticação JWT e **isolamento de dados por usuário**
(cada usuário só enxerga as próprias tarefas).

> Este README cobre o backend isolado. Para subir tudo (MySQL + backend + frontend)
> de uma vez com Docker, veja o **README na raiz do repositório**.

## Stack

- Python 3.12 / Django 5.2 (LTS)
- Django REST Framework + SimpleJWT (autenticação por token JWT)
- MySQL 8 (produção/Docker) — SQLite como fallback para testes locais
- `django-filter` (filtros), `drf-spectacular` (OpenAPI/Swagger), `django-cors-headers`

## Rodando com Docker (recomendado)

Feito a partir da raiz do repositório:

```bash
docker compose up --build
```

Isso sobe o MySQL, aplica migrações, roda o `seed_demo` e serve a API em
`http://localhost:8000`.

## Rodando localmente sem Docker

Pré-requisitos: Python 3.12+.

```bash
cd backend
python -m venv venv
# Windows PowerShell:  venv\Scripts\Activate.ps1
# Linux/Mac:           source venv/bin/activate
pip install -r requirements.txt

# Copie e ajuste as variáveis de ambiente
cp .env.example .env

# Para rodar sem MySQL, use SQLite:
export USE_SQLITE=1          # Windows: set USE_SQLITE=1

python manage.py migrate
python manage.py seed_demo   # cria admin + contas de teste (alice, bob)
python manage.py runserver
```

> Observação: `mysqlclient` (em `requirements.txt`) exige libs de MySQL no sistema.
> Para desenvolvimento local sem MySQL, use `USE_SQLITE=1` — os testes já rodam assim.

## Migrações, seed e testes

```bash
python manage.py makemigrations   # gerar migrações após alterar models
python manage.py migrate          # aplicar migrações
python manage.py seed_demo        # popular dados de exemplo (idempotente)
USE_SQLITE=1 python manage.py test  # 21 testes unitários mockados (não tocam no banco)
```

## Usuários criados pelo seed

| Perfil        | Usuário | Senha         | Observação                    |
|---------------|---------|---------------|-------------------------------|
| Administrador | `admin` | `admin12345`  | acesso ao `/admin`            |
| Teste         | `alice` | `Senha@12345` | 3 tarefas de exemplo          |
| Teste         | `bob`   | `Senha@12345` | 2 tarefas de exemplo          |

As credenciais do admin vêm de `DJANGO_SUPERUSER_*` no `.env`. Para criar um
superusuário manualmente: `python manage.py createsuperuser`.

## Endpoints principais

Base: `http://localhost:8000`

### Autenticação (`/api/auth/`)

| Método | Rota                        | Descrição                                  |
|--------|-----------------------------|--------------------------------------------|
| POST   | `/register/`                | Cadastro (`username`, `email`, `password`) |
| POST   | `/token/`                   | Login → `access` + `refresh` (JWT)         |
| POST   | `/token/refresh/`           | Renova o `access` a partir do `refresh`    |
| POST   | `/logout/`                  | Revoga o `refresh` (blacklist) — encerra a sessão |
| GET    | `/me/`                      | Dados do usuário autenticado               |
| POST   | `/password-reset/`          | Solicita reset (gera token; vai pro log)   |
| POST   | `/password-reset/confirm/`  | Confirma reset (`uid`, `token`, `new_password`) |

### Tarefas (`/api/tasks/`) — exigem `Authorization: Bearer <access>`

| Método | Rota            | Descrição                        |
|--------|-----------------|----------------------------------|
| GET    | `/tasks/`       | Lista (apenas do usuário logado) |
| POST   | `/tasks/`       | Cria tarefa                      |
| GET    | `/tasks/{id}/`  | Detalha                          |
| PUT/PATCH | `/tasks/{id}/` | Atualiza / marca concluída      |
| DELETE | `/tasks/{id}/`  | Exclui                           |

**Filtros**: `?completed=true|false`, `?created_after=YYYY-MM-DD`,
`?created_before=YYYY-MM-DD`, `?ordering=created_at` (ou `-created_at`).

### Documentação da API

- Swagger UI: `http://localhost:8000/api/docs/`
- Schema OpenAPI: `http://localhost:8000/api/schema/`
- Healthcheck: `http://localhost:8000/health/`

## Estrutura

```
backend/
├── config/        # settings, urls, wsgi/asgi, exception handler
├── accounts/      # cadastro, login JWT, reset de senha, /me
├── tasks/         # model Task, serializer, viewset, filtros, seed, testes
├── entrypoint.sh  # espera o DB, migra, semeia e sobe o servidor
└── Dockerfile
```

## Decisões de projeto

- **Isolamento de dados**: `TaskViewSet.get_queryset()` filtra por `owner=request.user`;
  acessar tarefa de outro usuário retorna 404 (não vaza existência).
- **Validação**: título não pode ser vazio/espaços e tem limite de tamanho
  (`TaskSerializer.validate_title`).
- **Erros legíveis**: handler custom em `config/exceptions.py` padroniza o corpo
  de erro e loga 5xx inesperados.
- **Segurança do reset**: resposta genérica que não revela se o e-mail existe.
