# Deploy — Railway

## Pré-requisitos

- Conta em [railway.app](https://railway.app)
- Railway CLI: `npm install -g @railway/cli`
- Stripe CLI (para testar webhooks localmente)

---

## 1. Criar projeto no Railway

```bash
# Login
railway login

# Criar projeto novo
railway init
# → escolha "Empty project"
# → nome: famme-performance
```

---

## 2. Adicionar PostgreSQL

No dashboard Railway:
1. Clique em **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Clique no serviço PostgreSQL → aba **"Variables"**
3. Copie o valor de `DATABASE_URL`

---

## 3. Configurar o serviço backend

```bash
# Na raiz do repo, aponta para a pasta do app
cd apps/web

# Criar o serviço apontando para o Dockerfile
railway service create --name api
```

No dashboard, vá em **Settings → Source** e configure:
- **Root Directory**: `apps/web`
- **Build Command**: (deixar vazio — usa o Dockerfile)

---

## 4. Variáveis de ambiente

No dashboard → serviço **api** → aba **"Variables"**, adicione:

```
DATABASE_URL          → (copiado do PostgreSQL acima)
JWT_ACCESS_SECRET     → openssl rand -base64 64
JWT_REFRESH_SECRET    → openssl rand -base64 64
ANTHROPIC_API_KEY     → sk-ant-...
STRIPE_SECRET_KEY     → sk_live_...
STRIPE_WEBHOOK_SECRET → whsec_... (gerado no passo 6)
STRIPE_PRICE_PRO      → price_...
STRIPE_PRICE_ELITE    → price_...
GARMIN_WEBHOOK_SECRET → (string aleatória)
NEXT_PUBLIC_APP_URL   → https://seu-projeto.up.railway.app
NODE_ENV              → production
```

Para gerar os secrets:
```bash
openssl rand -base64 64
```

---

## 5. Deploy

```bash
cd apps/web
railway up
```

O Railway vai:
1. Fazer build do Dockerfile (multi-stage, ~3min)
2. Rodar `prisma migrate deploy` via `entrypoint.sh`
3. Subir o servidor na porta 3000

Verifique a saúde em:
```
https://seu-projeto.up.railway.app/api/health
```

---

## 6. Configurar Stripe webhook

Após o deploy, pegue a URL do serviço e registre o webhook no Stripe:

```bash
# Dashboard Stripe → Developers → Webhooks → Add endpoint
# URL: https://seu-projeto.up.railway.app/api/stripe/webhook
# Eventos: customer.subscription.*, invoice.payment_failed
```

Copie o **Signing secret** gerado e atualize `STRIPE_WEBHOOK_SECRET` no Railway.

---

## 7. Redeploy após variáveis

```bash
railway redeploy
```

---

## Deploy contínuo (opcional)

No dashboard → serviço **api** → **Settings → Source**:
- Conecte ao GitHub: `pamksoares/famme-performance`
- Branch: `main`
- Root directory: `apps/web`

A partir daí, cada `git push origin main` dispara deploy automático.

---

## Comandos úteis

```bash
# Ver logs em tempo real
railway logs --tail

# Abrir shell no container
railway shell

# Rodar comando no ambiente Railway (ex: seed)
railway run yarn db:seed

# Ver variáveis configuradas
railway variables
```

---

## Próximo passo: app mobile

Após o deploy, atualize o `.env` do mobile:
```
EXPO_PUBLIC_API_URL=https://seu-projeto.up.railway.app
```

E faça build com EAS:
```bash
cd apps/mobile
eas build --platform ios --profile preview
```
