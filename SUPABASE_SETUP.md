# Finance App: publicar com login e banco online

## O que esse app faz agora

- Cada pessoa pode criar a propria conta com email e senha.
- Os dados ficam separados por usuario.
- O app salva no navegador e, quando o Supabase estiver configurado, tambem salva na nuvem.
- Voce pode acessar no computador e no celular usando a mesma conta.

## 1. Criar o projeto no Supabase

1. Entre em https://supabase.com
2. Crie uma conta.
3. Clique em `New project`.
4. Escolha nome, senha do banco e regiao.
5. Espere o projeto terminar de criar.

## 2. Criar a tabela

1. No painel do Supabase, abra `SQL Editor`.
2. Crie uma nova query.
3. Cole o conteudo do arquivo `supabase-schema.sql`.
4. Execute.

## 3. Pegar as chaves

1. No Supabase, abra `Project Settings`.
2. Entre em `API`.
3. Copie:
   - `Project URL`
   - `anon public key`

## 4. Configurar o app localmente

1. Duplique `.env.example` para `.env`.
2. Preencha:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Rode:

```powershell
npm run dev
```

## 5. Testar cadastro

1. Abra o app.
2. Clique em `Criar conta`.
3. Cadastre nome, email e senha.
4. Entre com essa conta.
5. Crie alguns dados.
6. Abra no celular ou outro navegador e entre com a mesma conta.

## 6. Publicar

O jeito mais simples e gratis para esse app eh usar `Vercel`.

1. Crie conta em https://vercel.com
2. Suba este projeto para um repositório no GitHub.
3. No Vercel, clique em `Add New Project`.
4. Conecte o repositório.
5. Antes de publicar, adicione as variaveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Publique.

## 7. Como outra pessoa usa

1. Voce manda o link do app publicado.
2. A pessoa cria a propria conta com email e senha.
3. Ela entra.
4. Os dados dela ficam separados dos seus.

## Observacao importante

- Nao use CPF para isso agora. Email e senha ja resolvem bem e com menos risco.
- Se quiser, depois podemos melhorar com:
  - reset de senha
  - perfil com nome editavel
  - convite para compartilhar uma mesma carteira
