# Studio frontend

Frontend Angular 20 para o gerador de landing pages. A aplicação usa sessões HTTP-only gerenciadas pela API; o navegador envia cookies com `withCredentials` e não armazena tokens de acesso.

## Pré-requisitos

- Node.js compatível com Angular 20
- npm ou pnpm
- Backend disponível em `http://localhost:8000` para desenvolvimento local

## Instalação e execução

```bash
npm install
npm start
```

Abra `http://localhost:4200/`.

Durante o desenvolvimento, as requisições `/api` são encaminhadas pelo `proxy.conf.json` para `http://localhost:8000`. Assim, o frontend usa a mesma origem lógica e a sessão funciona sem configurar uma URL absoluta no código.

## Variáveis de ambiente e URLs da API

O frontend não lê um arquivo `.env` em tempo de execução. A URL da API é definida nos arquivos Angular de ambiente:

| Arquivo | Configuração | Uso |
| --- | --- | --- |
| `src/environments/environment.development.ts` | `apiUrl: '/api/v1'` | Desenvolvimento local com proxy para `http://localhost:8000`. |
| `src/environments/environment.ts` | `apiUrl: 'https://studio-backend-xbm6.onrender.com/api/v1'` | Build de produção. |
| `proxy.conf.json` | `target: 'http://localhost:8000'` | Destino local das chamadas `/api` durante `ng serve`. |

Para apontar o build de produção para outra API, altere `apiUrl` em `src/environments/environment.ts` antes do build. Não coloque `INTERNAL_API_TOKEN`, `OD_API_TOKEN`, senhas ou outras credenciais no frontend: a autenticação usa o cookie de sessão criado pelo backend.

## Comandos

```bash
npm start       # servidor de desenvolvimento
npm run build   # build de produção
npm test        # testes unitários
```

Com pnpm, os comandos equivalentes são:

```bash
pnpm install
pnpm start
pnpm build
pnpm test
```

## Integração com o backend

O backend precisa estar em execução para login e geração:

```bash
cd ../backend
docker compose up -d
```

O usuário da aplicação é criado no banco do backend. O frontend apenas envia o formulário de login para `/api/v1/auth/login` e mantém a sessão via cookie HTTP-only.
