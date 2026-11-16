# Mãozinha com Docker

Este guia explica como rodar o Mãozinha completo (banco de dados, backend e frontend) em qualquer computador usando **Docker** e **Docker Compose**, sem instalar Node.js, Java, Maven ou PostgreSQL na máquina.

---

## 1. Visão geral

### 1.1. Objetivo

Ter um ambiente **reproduzível e portátil**: qualquer pessoa clona os repositórios, cria um arquivo `.env` e executa um único comando:

```bash
docker compose up --build
```

A forma de rodar sem Docker continua funcionando como antes (`npm run dev` no frontend e `./mvnw spring-boot:run` no backend).

### 1.2. Repositórios

O projeto é dividido em **dois repositórios Git**, que precisam estar clonados no computador:

| Repositório | Conteúdo | O que tem de Docker |
|---|---|---|
| `maozinha-frontend` (este) | React + Vite + TypeScript | `docker-compose.yml`, `.env.example`, `DOCKER.md`, `frontend/Dockerfile`, `frontend/nginx.conf`, script de inicialização do banco |
| `maozinha-backend` | Spring Boot 4 + Java 21 + Maven | `Dockerfile`, `.dockerignore`, `db/maozinha.sql` (schema do banco) |

> **Sobre "API" e "backend":** no Mãozinha eles são **a mesma aplicação**. O backend Spring Boot expõe a API REST em `/api/**`. Por isso existem 3 containers, e não 4.

### 1.3. Containers

| Serviço | Imagem | Responsabilidade | Porta interna | Porta no seu computador |
|---|---|---|---|---|
| `db` | `postgres:17-alpine` | Banco PostgreSQL. Na primeira subida cria os roles e aplica o schema. | 5432 | `127.0.0.1:5432` |
| `backend` | construída de `maozinha-backend/Dockerfile` | API REST Spring Boot (regras de negócio, autenticação JWT, acesso ao banco) | 8080 | `127.0.0.1:8080` |
| `frontend` | construída de `frontend/Dockerfile` | nginx servindo o React já compilado + proxy de `/api` para o backend | 80 | `3000` |

### 1.4. Comunicação

```
 Navegador
    │  http://localhost:3000
    ▼
┌─────────────────────────────┐
│ frontend (nginx)            │
│  /        → arquivos React  │
│  /api/*   → proxy ──────────┼──┐
└─────────────────────────────┘  │  rede interna do Docker
                                 ▼  http://backend:8080
                    ┌─────────────────────────┐
                    │ backend (Spring Boot)   │
                    └────────────┬────────────┘
                                 │ jdbc:postgresql://db:5432/maozinha
                                 ▼
                    ┌─────────────────────────┐
                    │ db (PostgreSQL)         │──► volume postgres-data
                    └─────────────────────────┘
```

Pontos importantes:

- O navegador acessa **somente** `http://localhost:3000`. As chamadas à API vão para `http://localhost:3000/api/...` e o nginx as repassa ao backend. Para o navegador, frontend e API estão na **mesma origem**, então não há problema de CORS, seja qual for a porta usada.
- Dentro da rede do Docker, os containers se acham **pelo nome do serviço** (`db`, `backend`). `localhost` dentro de um container aponta para ele mesmo, nunca para outro container.
- A ordem de inicialização respeita a disponibilidade real: o `backend` só inicia quando o `db` está `healthy` (`pg_isready`), e o `frontend` só inicia quando o `backend` está `healthy` (`/actuator/health` = `UP`).

---

## 2. Pré-requisitos

Você só precisa de **Git** e **Docker** (com Docker Compose v2).

### 2.1. Windows

1. Baixe o **Docker Desktop**: <https://www.docker.com/products/docker-desktop/>
2. Na instalação, mantenha marcada a opção **"Use WSL 2"** (recomendado).
3. Reinicie o computador se for solicitado.
4. Abra o Docker Desktop e espere aparecer **"Engine running"**.

> Dica: clone o projeto em uma pasta comum (ex.: `C:\projetos`). Pastas sincronizadas pelo OneDrive costumam causar problemas de permissão e lentidão.

### 2.2. macOS

1. Baixe o **Docker Desktop** em <https://www.docker.com/products/docker-desktop/>, escolhendo **Apple Silicon** (M1/M2/M3/M4) ou **Intel**.
2. Arraste o Docker para a pasta Aplicativos e abra-o.
3. Espere o ícone da baleia na barra de menus indicar que está rodando.

> Se o comando `docker` não for encontrado no terminal, abra o Docker Desktop e, em **Settings → Advanced**, ative a instalação das ferramentas de linha de comando.

### 2.3. Linux

Instale o Docker Engine e o plugin Compose seguindo a documentação oficial da sua distribuição: <https://docs.docker.com/engine/install/>

Exemplo rápido (Ubuntu/Debian):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # permite usar docker sem sudo
# faça logout/login para aplicar o grupo
```

### 2.4. Verificando a instalação

```bash
docker --version
docker compose version
docker run --rm hello-world
```

Os três comandos devem rodar sem erro. O `docker compose version` deve mostrar a versão **2 ou superior** (o comando é `docker compose`, com espaço).

---

## 3. Preparação do projeto

### 3.1. Clonar os dois repositórios lado a lado

```bash
mkdir maozinha && cd maozinha
git clone https://github.com/maozinha-app/maozinha-frontend.git
git clone https://github.com/maozinha-app/maozinha-backend.git
```

Estrutura esperada:

```
maozinha/
├── maozinha-frontend/   ← os comandos docker compose rodam aqui
└── maozinha-backend/
```

> Se o backend estiver em outro lugar, sem problema: ajuste `BACKEND_DIR` no `.env` (passo 3.3).

### 3.2. Entrar na pasta do projeto

```bash
cd maozinha-frontend
```

### 3.3. Criar o arquivo `.env`

Linux/macOS/Git Bash:

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

### 3.4. Preencher as variáveis

Abra o `.env` em um editor e troque **todos** os valores que começam com `TROQUE_`:

| Variável | Obrigatória | O que é |
|---|---|---|
| `BACKEND_DIR` | sim | Caminho do repositório `maozinha-backend` (padrão `../maozinha-backend`) |
| `POSTGRES_DB` | sim | Nome do banco (padrão `maozinha`) |
| `POSTGRES_USER` | sim | Superusuário administrativo do container (padrão `postgres`) |
| `POSTGRES_PASSWORD` | sim | Senha do superusuário |
| `DB_APP_PASSWORD` | sim | Senha do role `maozinha_app`, usado pelo backend |
| `JWT_SECRET` | sim | Segredo dos tokens JWT, **mínimo de 32 caracteres** |
| `MAIL_USERNAME` | sim | E-mail remetente da recuperação de senha. Precisa ter formato válido, senão o backend não inicia |
| `MAIL_PASSWORD` | não | Senha de app do Gmail. Sem ela, o envio do e-mail de recuperação falha |
| `FRONTEND_PORT` | não | Porta do frontend no seu computador (padrão `3000`) |
| `BACKEND_PORT` | não | Porta da API no seu computador (padrão `8080`) |
| `POSTGRES_PORT` | não | Porta do PostgreSQL no seu computador (padrão `5432`) |

Para gerar senhas e o `JWT_SECRET`:

```bash
openssl rand -base64 48
```

(No Windows sem OpenSSL, use qualquer gerador de senhas com 40+ caracteres.)

> ⚠️ O `.env` contém segredos e **não deve ser commitado**. Ele já está no `.gitignore`.

> ⚠️ `POSTGRES_PASSWORD`, `DB_APP_PASSWORD`, `POSTGRES_USER` e `POSTGRES_DB` são aplicados **apenas na primeira subida** (quando o volume do banco é criado). Trocar depois no `.env` **não** altera o banco existente. Veja a seção 7.4.

---

## 4. Executando a aplicação

Na pasta `maozinha-frontend`:

```bash
docker compose up --build
```

O que acontece:

1. **Build das imagens** (a primeira vez demora alguns minutos, porque baixa as dependências do Maven e do npm; as próximas são bem mais rápidas):
   - `backend`: compila o Spring Boot com Maven/JDK 21 e gera uma imagem final só com o JRE.
   - `frontend`: roda `npm ci` e `npm run build` com Node 22 e gera uma imagem nginx só com os arquivos estáticos.
2. **`db`** inicia. Na primeira vez, o script `docker/postgres/init/01-init-maozinha.sh`:
   - cria os roles `maozinha_migrator` (dono do schema) e `maozinha_app` (usado pela aplicação);
   - aplica `maozinha-backend/db/maozinha.sql` (tabelas, constraints, índices, triggers, funções e as categorias iniciais).
3. **`backend`** espera o banco ficar saudável, inicia e o Hibernate **valida** o schema (`ddl-auto: validate`).
4. **`frontend`** espera o backend ficar saudável e começa a servir a aplicação.

A aplicação está pronta quando `docker compose ps` mostra os três serviços como `healthy`.

O terminal fica preso mostrando os logs. `Ctrl+C` para os containers. Para rodar em segundo plano, use `docker compose up -d --build`.

### 4.1. Endereços

| O quê | URL |
|---|---|
| **Aplicação (frontend)** | <http://localhost:3000> |
| API pelo frontend (o mesmo caminho que o navegador usa) | <http://localhost:3000/api> |
| API direta no backend | <http://localhost:8080/api> |
| Health check do backend | <http://localhost:8080/actuator/health> |
| PostgreSQL | `localhost:5432` (somente a partir do seu computador) |

> A documentação Swagger/OpenAPI está **desativada** na configuração atual do backend (`springdoc.*.enabled: false`). Os endpoints estão listados no `README.md` do repositório do backend.

Teste rápido da API pelo terminal:

```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"}
```

---

## 5. Comandos úteis

Rode todos na pasta `maozinha-frontend`. Os serviços se chamam `db`, `backend` e `frontend`.

```bash
# Subir os serviços em segundo plano (reconstruindo se o código mudou)
docker compose up -d --build

# Ver os containers e o estado de saúde
docker compose ps

# Acompanhar os logs de todos os serviços
docker compose logs -f

# Logs de um serviço específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Parar os serviços (os containers continuam existindo)
docker compose stop

# Reiniciar os serviços
docker compose restart
docker compose restart backend      # só um serviço

# Remover os containers e a rede, PRESERVANDO o volume do banco
docker compose down

# Reconstruir as imagens do zero, sem cache
docker compose build --no-cache
```

### 5.1. `docker compose down` × `docker compose down -v`

| Comando | Containers | Rede | **Volume do banco (`postgres-data`)** |
|---|---|---|---|
| `docker compose down` | removidos | removida | ✅ **preservado**: os dados continuam lá |
| `docker compose down -v` | removidos | removida | ❌ **APAGADO**: todos os dados do PostgreSQL são perdidos |

> 🚨 **`docker compose down -v` apaga definitivamente todos os usuários, serviços, avaliações e demais dados do banco.** Na subida seguinte o banco é recriado vazio, só com as categorias iniciais. Use apenas quando quiser recomeçar do zero e, se os dados importarem, faça um backup antes (seção 6.4).

---

## 6. Banco de dados

### 6.1. Persistência

Os dados ficam no volume Docker nomeado **`maozinha_postgres-data`**, montado em `/var/lib/postgresql/data`. O volume sobrevive a `stop`, `restart`, `down`, `up --build` e à recriação dos containers. Ele só é apagado com `docker compose down -v` ou `docker volume rm`.

```bash
docker volume ls | grep maozinha
```

### 6.2. Acessando o PostgreSQL

Pelo terminal, dentro do container:

```bash
docker compose exec db psql -U postgres -d maozinha
```

(Troque `postgres`/`maozinha` se tiver mudado `POSTGRES_USER`/`POSTGRES_DB`.)

Por uma ferramenta gráfica (DBeaver, pgAdmin, DataGrip):

- Host: `localhost`
- Porta: `5432` (ou o valor de `POSTGRES_PORT`)
- Banco: `maozinha`
- Usuário: `postgres` + `POSTGRES_PASSWORD` (administrador) **ou** `maozinha_app` + `DB_APP_PASSWORD` (mesmas permissões da aplicação)

A porta está ligada apenas a `127.0.0.1`, então outras máquinas da rede não conseguem acessar o banco.

### 6.3. Schema e "migrations"

O projeto **não usa** ferramenta de migrations (Flyway/Liquibase). O schema é um script SQL único, `maozinha-backend/db/maozinha.sql`, e o Hibernate apenas **valida** o banco (`ddl-auto: validate`), sem criar nem alterar tabelas.

- O script é aplicado **automaticamente na primeira subida**, quando o volume está vazio.
- Ele **não** é reaplicado nas subidas seguintes, para não apagar os dados (o próprio script começa com `DROP SCHEMA public CASCADE`).

Se o `maozinha.sql` mudar e você quiser aplicar a nova versão:

- **Sem dados importantes:** recrie o banco do zero:
  ```bash
  docker compose down -v
  docker compose up -d --build
  ```
- **Com dados importantes:** faça backup (6.4) e aplique manualmente apenas os comandos `ALTER TABLE` necessários:
  ```bash
  docker compose exec db psql -U postgres -d maozinha -c "SET ROLE maozinha_migrator; ALTER TABLE ..."
  ```

### 6.4. Backup e restauração

**Backup** (gera `backup-maozinha.sql` no seu computador):

```bash
docker compose exec -T db pg_dump -U postgres -d maozinha --clean --if-exists > backup-maozinha.sql
```

**Restauração** (substitui o conteúdo atual do banco pelo do backup):

```bash
docker compose stop backend
docker compose exec -T db psql -U postgres -d maozinha < backup-maozinha.sql
docker compose start backend
```

> No Windows, rode estes comandos no **Git Bash** ou no **WSL**. O redirecionamento `<`/`>` do PowerShell pode alterar a codificação do arquivo.

### 6.5. Identificando problemas de conexão

```bash
docker compose ps                     # db está "healthy"?
docker compose logs db                # erros na inicialização / no script SQL
docker compose logs backend | grep -iE "error|caused"
docker compose exec db pg_isready -U postgres -d maozinha
```

---

## 7. Solução de problemas

### 7.1. Porta já utilizada por outro programa

Erro parecido com `Bind for 0.0.0.0:3000 failed: port is already allocated` ou `address already in use`.

Isso acontece, por exemplo, se o backend local (`mvnw spring-boot:run`) estiver usando a 8080 ou se houver um PostgreSQL instalado usando a 5432. Duas soluções:

- Feche o programa que está usando a porta, **ou**
- Troque a porta no `.env` (ex.: `BACKEND_PORT=18080`, `POSTGRES_PORT=15432`, `FRONTEND_PORT=8000`) e rode `docker compose up -d` de novo.

Para descobrir quem usa a porta:

```bash
# macOS / Linux
lsof -i :8080
# Windows (PowerShell)
netstat -ano | findstr :8080
```

### 7.2. Container não inicia / fica reiniciando

```bash
docker compose ps
docker compose logs --tail=100 backend
```

Causas comuns no backend:

| Mensagem no log | Causa | Solução |
|---|---|---|
| `required variable ... is missing a value` (ao rodar o compose) | variável obrigatória faltando no `.env` | preencha a variável indicada |
| `O endereço de e-mail é inválido.` | `MAIL_USERNAME` vazio ou mal formatado | use um e-mail válido (pode ser o de exemplo) |
| `WeakKeyException` / `key byte array is ... bits` | `JWT_SECRET` com menos de 32 caracteres | use um segredo maior |
| `Schema validation: ...` | o banco não bate com as entidades Java | veja 7.5 |
| `password authentication failed for user "maozinha_app"` | `DB_APP_PASSWORD` mudou depois da criação do banco | veja 7.4 |

### 7.3. Falha na conexão com o PostgreSQL

- Confira se o `db` está `healthy` em `docker compose ps`.
- Dentro do Docker, o backend usa **`db:5432`**, nunca `localhost:5432` nem a `POSTGRES_PORT` (essa porta é só para acessar o banco a partir do seu computador).
- Veja `docker compose logs db`. Se o script de inicialização falhou, o volume pode ter ficado incompleto. Corrija o problema e recrie com `docker compose down -v && docker compose up -d --build` (**apaga os dados**).

### 7.4. Variáveis de ambiente incorretas

- Após editar o `.env`, recrie os containers: `docker compose up -d` (o `restart` **não** relê o `.env`).
- Para ver a configuração final que o Compose está usando: `docker compose config`.
- **Senhas do banco não mudam depois da primeira subida.** Para trocar a senha do `maozinha_app` sem perder dados:
  ```bash
  docker compose exec db psql -U postgres -d maozinha -c "ALTER ROLE maozinha_app PASSWORD 'nova_senha'"
  ```
  Depois atualize `DB_APP_PASSWORD` no `.env` e rode `docker compose up -d`.

### 7.5. Erros de schema / "migrations"

`Schema validation: missing table [...]` ou `wrong column type [...]` significa que o banco não corresponde às entidades Java.

- Se a mensagem citar o script de inicialização (`docker compose logs db`), o `maozinha.sql` tem um erro de SQL.
- Se for erro de validação do Hibernate, o `db/maozinha.sql` está desatualizado em relação às entidades: atualize o script no repositório do backend e recrie o banco (6.3).
- `ERRO: /schema/maozinha.sql não encontrado` ou `bind source path does not exist`: o `BACKEND_DIR` no `.env` não aponta para o repositório do backend.

### 7.6. Frontend não consegue acessar a API

- Abra <http://localhost:3000/api/categories>. Uma resposta **403** significa que o proxy está funcionando (a rota exige login). **502 Bad Gateway** significa que o backend não está rodando: veja `docker compose logs backend`.
- O frontend do Docker é compilado com `VITE_API_URL=/api`. O arquivo `frontend/.env` local **não** é usado no Docker.
- Depois de mudar código do frontend, rode `docker compose up -d --build frontend`: o código fica **compilado dentro da imagem**, não existe hot reload.

### 7.7. Backend não consegue acessar o banco

Veja 7.3 e 7.4. Confirme também que o backend usa o role `maozinha_app` e que o role existe:

```bash
docker compose exec db psql -U postgres -d maozinha -c "\du"
```

### 7.8. Permissões e volumes

- **Windows:** se o `db` falhar com `/docker-entrypoint-initdb.d/01-init-maozinha.sh: not found` ou `bad interpreter`, o script foi baixado com quebras de linha do Windows (CRLF). O repositório tem `.gitattributes` forçando LF. Corrija baixando o arquivo de novo do Git:
  ```bash
  rm docker/postgres/init/01-init-maozinha.sh
  git checkout -- docker/postgres/init/01-init-maozinha.sh
  docker compose down -v && docker compose up -d --build   # banco ainda não tinha dados
  ```
  Outra opção é converter o arquivo para LF no editor (no VS Code, clique em "CRLF" na barra inferior e troque para "LF").
- **Windows/macOS:** em **Docker Desktop → Settings → Resources → File sharing**, a pasta do projeto precisa estar compartilhada (normalmente já está para a pasta do usuário).
- **Linux:** `permission denied while trying to connect to the Docker daemon socket` → adicione seu usuário ao grupo `docker` (seção 2.3).
- O volume do banco é gerenciado pelo Docker (não é uma pasta do projeto), então não há conflito de permissões com o usuário do computador.

---

## 8. Atualizando o projeto

Para trazer código novo e reconstruir **sem perder dados**:

```bash
# 1. Atualize os dois repositórios
cd maozinha-frontend && git pull
cd ../maozinha-backend && git pull
cd ../maozinha-frontend

# 2. Reconstrua e recrie os containers
docker compose up -d --build
```

O volume `postgres-data` é reaproveitado e os dados continuam lá.

Atenção:

- **Nunca** use `down -v` só para "atualizar".
- Se o `.env.example` ganhou variáveis novas, copie-as para o seu `.env`.
- Se o `db/maozinha.sql` mudou, ele **não** é reaplicado automaticamente. Siga a seção 6.3.
- Se algo estranho acontecer depois de atualizar, tente `docker compose build --no-cache` e depois `docker compose up -d`.

---

## 9. Arquivos da dockerização

```
maozinha-frontend/
├── docker-compose.yml                       # orquestra db, backend e frontend
├── .env.example                             # modelo das variáveis (copiar para .env)
├── .gitignore                               # ignora o .env da raiz
├── .gitattributes                           # força LF nos scripts .sh
├── DOCKER.md                                # este guia
├── docker/postgres/init/01-init-maozinha.sh # cria roles e aplica o schema (1ª subida)
└── frontend/
    ├── Dockerfile                           # Node 22 (build) → nginx 1.30 (runtime)
    ├── nginx.conf                           # SPA + proxy /api → backend:8080
    └── .dockerignore

maozinha-backend/
├── Dockerfile                               # Maven + JDK 21 (build) → JRE 21 (runtime)
├── .dockerignore                            # exclui target/, .env e application-dev.yml
└── db/maozinha.sql                          # schema do banco
```
