# To-Do — React Native + Django REST (containerizado)

Aplicação de lista de tarefas com **autenticação segura por JWT** e **isolamento de
dados por usuário** (cada pessoa vê apenas as próprias tarefas).

- **Backend** — Django 5.2 + Django REST Framework + SimpleJWT + MySQL → [`backend/`](backend/)
- **Frontend** — React Native (Expo, TypeScript) + TanStack Query → [`frontend/`](frontend/)
- **Infra** — `docker-compose` orquestra **MySQL + API + app (Expo Web)**

---

## 1. Rodar tudo com Docker (recomendado)

### Pré-requisitos
- **Docker Desktop** (Docker Engine 24+ e Docker Compose v2).
  Instalação: https://docs.docker.com/get-docker/

### Passos

```bash
# 1. Clone o repositório e entre nele
git clone <URL_DO_REPO> && cd React-Native-e-Django-REST

# 2. Crie o arquivo de variáveis de ambiente
cp .env.example .env          # Windows PowerShell: copy .env.example .env

# 3. Suba os três serviços (MySQL + backend + frontend)
docker compose up --build
```

> **macOS (Intel/Apple Silicon):** use o compose dedicado, com imagens nativas arm64
> e **live-reload** do código via bind mounts:
> ```bash
> docker compose -f docker-compose.mac.yml up --build
> ```
> Diferença: o `docker-compose.yml` padrão embute o código na imagem (ideal no
> Windows); o `docker-compose.mac.yml` monta o código do host — editar o backend
> recarrega sozinho (autoreload do Django) e editar o app reflete ao recarregar o
> navegador. Comandos abaixo funcionam nos dois; no Mac, acrescente
> `-f docker-compose.mac.yml`.

Na primeira subida o backend **espera o MySQL**, **aplica as migrações** e **popula
dados de exemplo** automaticamente (usuário admin + contas de teste com tarefas).

| Serviço      | URL                                  |
|--------------|--------------------------------------|
| App (Web)    | http://localhost:8081                |
| API          | http://localhost:8000                |
| Swagger/Docs | http://localhost:8000/api/docs/      |
| Django Admin | http://localhost:8000/admin          |

Para parar: `docker compose down` (adicione `-v` para apagar também o volume do banco).

> **Por que o app roda no navegador (Expo Web)?** Um emulador Android/iOS não roda
> dentro de um container. Para atender ao pedido de "tudo containerizado", o app é
> servido como **Expo Web** (mesmo código React Native via `react-native-web`). Para
> rodar no **celular/emulador**, use o modo local do app (seção 3) com o Expo Go.

---

## 2. Comandos úteis (migrações, seed, testes)

```bash
# Rodar a suíte de testes do backend (usa SQLite p/ não exigir privilégio de
# criar o banco de teste no MySQL)
docker compose exec -e USE_SQLITE=1 backend python manage.py test

# Reaplicar migrações / criar novas
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py makemigrations

# Popular novamente os dados de exemplo (idempotente)
docker compose exec backend python manage.py seed_demo

# Criar um superusuário manualmente
docker compose exec backend python manage.py createsuperuser
```

---

## 3. Rodar sem Docker (desenvolvimento local)

### Backend (Python 3.12+)

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\Activate.ps1   |   Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Modo simples sem MySQL (usa SQLite):
export USE_SQLITE=1          # Windows PowerShell: $env:USE_SQLITE=1

python manage.py migrate
python manage.py seed_demo
python manage.py runserver    # http://localhost:8000
```

### Frontend (Node 20+)

```bash
cd frontend
npm install
cp .env.example .env          # ajuste EXPO_PUBLIC_API_URL se necessário

npm run web                   # navegador
npm start                     # Expo Dev Tools: QR p/ Expo Go, tecla a/i p/ emulador
```

Detalhes em [`backend/README.md`](backend/README.md) e [`frontend/README.md`](frontend/README.md).

---

## 4. Usuários criados pelo seed

| Perfil        | Usuário | Senha         | Uso                                   |
|---------------|---------|---------------|---------------------------------------|
| Administrador | `admin` | `admin12345`  | Django Admin (`/admin`)               |
| Teste         | `alice` | `Senha@12345` | login no app (com 3 tarefas de exemplo) |
| Teste         | `bob`   | `Senha@12345` | login no app (com 2 tarefas)          |

As credenciais do admin são configuráveis via `DJANGO_SUPERUSER_*` no `.env`.

---

## 5. Funcionalidades

- **Autenticação**: cadastro, login (JWT access+refresh) e **recuperação de senha via token**.
- **Sessão segura**: token guardado com `expo-secure-store` (Keychain/Keystore) no mobile;
  fallback para `localStorage` no Web (ver nota de segurança no `frontend/README.md`).
- **Tarefas**: criar, listar, editar, **marcar como concluída** e excluir.
- **Filtros**: por **status** (todas / pendentes / concluídas) e por **data de criação**;
  ordenação por data.
- **Isolamento de dados**: cada requisição é escopada ao usuário autenticado.
- **Validações**: título obrigatório (não vazio) e limites de tamanho.
- **UX**: estados de carregamento, erro e vazio; pull-to-refresh; atualização otimista ao concluir.
- **Extras**: refresh automático do JWT em `401`, documentação Swagger, healthcheck,
  logs legíveis e handler de erros padronizado.

---

## 6. Estrutura do repositório

```
.
├── docker-compose.yml      # MySQL + backend + frontend (padrão / Windows / Linux)
├── docker-compose.mac.yml   # variante macOS: arm64 nativo + live-reload (bind mounts)
├── .env.example            # variáveis do compose
├── README.md               # este arquivo
├── DEVELOPMENT_LOG.md       # registro cronológico + uso de IA
├── DELIVERY.md             # comentários de entrega + split em 2 repos
├── backend/                # Django + DRF (ver backend/README.md)
└── frontend/               # React Native / Expo (ver frontend/README.md)
```