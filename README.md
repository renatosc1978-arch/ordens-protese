# Gestao de Ordens de Servico de Protese Odontologica

Aplicativo web simples para uso local em laboratorio odontologico.

## Como usar

Abra o arquivo `index.html` no navegador.

Os dados ficam salvos no proprio navegador usando `localStorage`. Use os botoes **Exportar** e **Importar** para fazer backup ou migrar os dados para outro computador.

## Funcionalidades

- Cadastro de clientes / dentistas
- Cadastro de pacientes vinculados ao cliente
- Cadastro de ordens de servico
- Tipos de trabalho: protocolo, coroa, guia cirurgico, placa, provisorio, zirconia, dissilicato e PMMA
- Status: recebido, em desenho, em fresagem, em acabamento, pronto e entregue
- Prazo de entrega, valor e observacoes
- Busca por texto, status e tipo
- Relatorio mensal com quantidade, valor total, ticket medio e resumo por tipo

## Manutencao

Estrutura sem dependencias externas:

- `index.html`: telas e formularios
- `styles.css`: visual da aplicacao
- `app.js`: regras, cadastros, busca, relatorios e armazenamento local
