# Cursos — Avaliação final e certificado PDF

## O que foi acrescentado

- Avaliação final obrigatória antes da conclusão de cada módulo.
- 5 questões por módulo, totalizando 200 questões nos 40 módulos atuais.
- Nota de 0 a 10.
- Média mínima de 7,0 para aprovação.
- Módulo só é contabilizado como concluído após aprovação.
- Tentativa novamente em caso de nota inferior a 7,0.
- Progresso e notas salvos no navegador por curso.
- Curso só é considerado concluído quando todos os módulos estão aprovados.
- Certificado liberado ao concluir todos os módulos.
- Certificado pronto para impressão/salvamento em PDF, em A4 paisagem.
- Certificado identifica instrutor, curso, data e número do certificado.

## Como testar

1. Abra o projeto.
2. Execute `npm install` caso seja uma pasta nova.
3. Execute `npm run build`.
4. Execute `npm run dev`.
5. Abra a aba **CURSOS**.
6. Entre em um curso.
7. Abra um módulo.
8. Leia o conteúdo e clique em **FAZER AVALIAÇÃO FINAL**.
9. Responda as 5 questões.
10. Para testar aprovação, selecione as alternativas corretas.
11. Para testar reprovação, escolha respostas incorretas e confirme que o módulo permanece pendente.
12. Após aprovar todos os módulos, use **EMITIR CERTIFICADO EM PDF**.
13. Na janela do certificado, escolha **Salvar como PDF** no diálogo de impressão do navegador.

## Observação técnica

A versão atual mantém o progresso no `localStorage`, sem alterar as demais áreas do Assistente do Instrutor. A persistência em Supabase pode ser integrada posteriormente sem mudar a experiência do usuário.
