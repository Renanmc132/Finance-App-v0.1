# Finance App

Aplicativo de controle financeiro pessoal com foco em:

- entradas e saídas
- parcelas
- metas
- guardado/investimento
- dashboards mensais e anuais
- organização por banco, categoria e método de pagamento

## Visão Geral

Este projeto foi pensado para transformar uma planilha financeira em um app mais visual, prático e editável no dia a dia.

Hoje ele permite:

- cadastrar bancos
- cadastrar categorias
- registrar entradas
- registrar gastos
- controlar parcelas
- acompanhar metas
- vincular guardados/investimentos a bancos
- visualizar dashboards e análises anuais

## Tecnologias

- Preact
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Supabase (opcional, para autenticação e banco online)

## Como Rodar

```powershell
npm install
npm run dev
```

## Banco Online

Se quiser usar login e sincronização entre dispositivos, configure o Supabase.

Arquivos importantes:

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [supabase-schema.sql](./supabase-schema.sql)
- [.env.example](./.env.example)

## Colaboradores

Você pode editar esta seção quando quiser.

- Manuela de Lima Ramos - manuelalramos
- Renan Machado Carro - Renanmc132

