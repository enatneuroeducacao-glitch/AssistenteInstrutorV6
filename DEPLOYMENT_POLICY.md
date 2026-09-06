# Política de publicação — NeuroDrive ENAT

## Fonte oficial
O repositório `main` é a fonte oficial do código do NeuroDrive.

## Produção
O pipeline oficial de produção é:

`GitHub main → GitHub Actions → GitHub Pages → neurodrive.hsi-doth-pg.com.br`

O workflow oficial é `.github/workflows/deploy-neurodrive-pages.yml`.

## Vercel
Vercel não é o pipeline primário do NeuroDrive. O projeto/deployment existente deve ser preservado apenas como contingência até a homologação completa do GitHub Pages.

## Backend
Supabase permanece responsável pelo banco de dados, autenticação e Edge Functions. Nenhuma chave `service_role` deve ser enviada ao frontend.

## Homologação
Após cada mudança funcional relevante, validar build, publicação e, quando aplicável, o fluxo NeuroDrive → Hub ENAT → Central ENAT HSI.
