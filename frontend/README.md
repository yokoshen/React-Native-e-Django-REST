# To-Do — App Mobile (React Native + Expo)

App de lista de tarefas em **React Native (Expo, TypeScript)** que consome a API
Django. Autenticação **JWT** com armazenamento seguro do token, cache de dados com
**TanStack Query** e navegação com **React Navigation**.

> Para subir tudo junto (API + banco + app) com Docker, use o **README na raiz**.

## Funcionalidades

- Cadastro, login e recuperação de senha (via token).
- Sessão persistida com **expo-secure-store** (Keychain/Keystore no mobile).
- CRUD de tarefas: criar, listar, editar, concluir e excluir.
- Filtro por **status** (todas/pendentes/concluídas) e por **data de criação**
  (hoje / últimos 7 dias / qualquer), além de ordenação por data.
- Refresh automático do token JWT em respostas `401`.
- Estados de carregamento, erro e vazio; pull-to-refresh.

## Pré-requisitos

- Node.js 20+
- App **Expo Go** no celular, **ou** um emulador Android / simulador iOS,
  **ou** apenas o navegador (modo Web).

## Rodando localmente

```bash
cd frontend
npm install
cp .env.example .env       # ajuste EXPO_PUBLIC_API_URL se necessário

npm run web                # abre no navegador (http://localhost:8081)
# ou
npm start                  # abre o Expo Dev Tools (QR code p/ Expo Go, a/i p/ emulador)
```

> **Backend precisa estar rodando** em `EXPO_PUBLIC_API_URL` (padrão
> `http://localhost:8000`). Veja o README da raiz ou de `backend/`.

### Dispositivo físico (Expo Go)

`localhost` no celular aponta para o próprio aparelho. Defina o IP da sua máquina:

```bash
# .env
EXPO_PUBLIC_API_URL=http://SEU_IP_LAN:8000
```

E garanta que o backend aceite esse host (`DJANGO_ALLOWED_HOSTS`) e origem (CORS).

## Rodando via Docker

O `docker-compose.yml` da raiz sobe este app em modo **Expo Web** na porta `8081`.
Um emulador mobile não roda dentro de container — por isso o container serve a
versão Web (mesmo código React Native via `react-native-web`). Para rodar no
celular/emulador, use o fluxo local acima com o Expo Go.

## Estrutura

```
frontend/
├── App.tsx                 # providers: QueryClient, SafeArea, Auth
└── src/
    ├── api/                # client axios (JWT + refresh), endpoints auth/tasks
    ├── auth/               # AuthContext + storage seguro (SecureStore/localStorage)
    ├── hooks/              # useTasks (TanStack Query)
    ├── navigation/         # stacks Auth e App + deep linking
    ├── screens/            # Login, Register, ForgotPassword, TaskList, TaskForm
    ├── components/         # UI reutilizável (Button, Input, TaskItem, confirm)
    ├── theme.ts            # cores/spacing
    └── config.ts           # resolução da URL da API
```

## Nota de segurança (Web)

`expo-secure-store` não existe no ambiente Web; nesse caso o token cai em
`localStorage` (ver `src/auth/storage.ts`). No **mobile** (iOS/Android) o token
é guardado de forma criptografada no Keychain/Keystore. Essa diferença está
isolada na abstração `tokenStorage` e documentada no código.

## Contas de teste (criadas pelo seed do backend)

| Usuário | Senha         |
|---------|---------------|
| `alice` | `Senha@12345` |
| `bob`   | `Senha@12345` |
| `admin` | `admin12345`  |
