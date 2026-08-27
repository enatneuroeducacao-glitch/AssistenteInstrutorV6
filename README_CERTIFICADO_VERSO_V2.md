# Certificado ENAT — Frente + Verso v2

Atualização do módulo de Cursos do Assistente do Instrutor.

## Alterações
- Certificado em 2 páginas A4 paisagem: frente e verso.
- Verso com módulos/matérias estudadas e nota individual de cada avaliação.
- Média final calculada automaticamente pela média das notas dos módulos.
- Registro persistente do certificado no localStorage, incluindo notas e média final.
- Base legal/referências federais no verso:
  - Lei nº 9.394/1996 (LDB), arts. 39, 40 e 42.
  - Decreto nº 5.154/2004, arts. 1º e 3º.
- Aviso de natureza da formação: o documento é certificado institucional de conclusão e não diploma de graduação, pós-graduação ou curso técnico, nem substitui habilitação/licença/certificação exigida por órgão competente.
- Assinatura institucional visual de VILMAR BECKER em frente e verso.
- QR Code não utilizado.

## Observação técnica
O PDF continua sendo gerado pelo comando de impressão do navegador (Salvar como PDF). O layout utiliza CSS de impressão A4 paisagem e quebra automática entre frente e verso.

## Teste
O arquivo `src/main.jsx` foi validado quanto à sintaxe JSX/JavaScript com o compilador TypeScript. O build Vite não foi executado neste ambiente porque o `node_modules` presente foi instalado para outro ambiente e está sem o binário opcional Linux do Rollup; no Windows, execute `npm.cmd install` e depois `npm.cmd run dev` ou `npm.cmd run build`.
