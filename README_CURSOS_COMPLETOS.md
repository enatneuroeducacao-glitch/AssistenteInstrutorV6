
## CURSOS — conteúdo completo (25/08/2026)

A aba **Cursos** foi atualizada exclusivamente para a área de formação continuada. O restante do sistema não foi alterado.

Arquivos adicionados:
- `src/courseContent.js` — conteúdo didático completo dos 6 cursos exibidos na aba Cursos.
- `src/main_PRE_CURSOS_COMPLETOS_20260825.jsx` — backup do `main.jsx` antes desta alteração.
- `supabase/cursos_v3_conteudo_completo.sql` — migração opcional para persistir os módulos no Supabase.

### Teste local
No diretório do projeto:
```cmd
npm install
npm run build
npm run dev
```

### Supabase
Execute primeiro as migrações de Cursos existentes (`cursos_v1.sql` e `cursos_v2_conteudo.sql`, se ainda não tiverem sido executadas) e depois `cursos_v3_conteudo_completo.sql`.

A versão local de `src/courseContent.js` funciona como fallback, portanto a tela de conteúdo continua disponível mesmo antes da carga do conteúdo no Supabase.
