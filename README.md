# Gestao de Ordens de Servico de Protese Odontologica

Aplicativo web simples para uso local em laboratorio odontologico.

## Como usar

Abra o arquivo `index.html` no navegador.

Sem Supabase configurado, os dados ficam salvos no proprio navegador. Com Supabase configurado, clientes, pacientes, ordens e anexos ficam sincronizados entre computadores.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra o editor SQL do Supabase e execute o arquivo `supabase-schema.sql`.
3. Em Project Settings > API, copie a Project URL e a anon public key.
4. Preencha o arquivo `supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA-ANON-KEY",
  bucket: "order-files"
};
```

Depois disso, abra o app novamente. Se houver dados locais e o Supabase estiver vazio, o app tenta enviar esses dados para a nuvem automaticamente.

## Funcionalidades

- Cadastro de clientes / dentistas
- Cadastro de pacientes vinculados ao cliente
- Ficha do paciente ao clicar no nome, com dados, ordens vinculadas, fotos e arquivos anexados
- Cadastro de ordens de servico
- Tipos de trabalho: protocolo, coroa, guia cirurgico, placa, provisorio, zirconia, dissilicato e PMMA
- Status: recebido, em desenho, em fresagem, em acabamento, pronto e entregue
- Prazo de entrega, valor e observacoes
- Alerta configuravel por ordem, com antecedencia em dias antes do prazo
- Historico automatico com data e hora de cada mudanca de status
- Upload de arquivos por ordem, incluindo fotos, escaneamentos e arquivos 3D `.ply`
- Visualizador simples para imagens e modelos 3D `.ply`
- Sincronizacao via Supabase entre navegadores e computadores
- Busca por texto, status e tipo
- Relatorio mensal com quantidade, valor total, ticket medio e resumo por tipo

## Manutencao

Estrutura sem dependencias externas:

- `index.html`: telas e formularios
- `supabase-config.js`: configuracao da conexao Supabase
- `supabase-schema.sql`: tabelas, bucket e politicas do Supabase
- `styles.css`: visual da aplicacao
- `app.js`: regras, cadastros, busca, relatorios e armazenamento local
