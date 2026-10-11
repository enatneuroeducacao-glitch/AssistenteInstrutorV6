# NeuroDrive para Android (APK de homologação)

Este fluxo adiciona uma embalagem Android com Capacitor sem substituir a PWA nem alterar a publicação web de produção.

## Gerar o APK

1. Abra **Actions** no GitHub.
2. Execute **Build NeuroDrive Android APK** na branch `feat/neurodrive-android-apk`.
3. Aguarde o job `build-apk` terminar.
4. Baixe o artefato `neurodrive-android-debug-apk` e extraia `app-debug.apk`.

O workflow compila o mesmo projeto React/Vite e preserva o backend Supabase existente. Não cria banco de dados separado. O APK de debug serve para homologação e instalação direta em Android; não é ainda uma versão assinada para publicação na Google Play.

## Antes de distribuir

- Instalar em pelo menos um Android real e validar login, confirmação de e-mail, navegação, câmera/arquivos quando aplicável e persistência dos dados.
- Confirmar os links de retorno de autenticação do Supabase para o aplicativo.
- Definir o processo de assinatura de release e guardar a chave com segurança antes de distribuir atualizações públicas.
- Só depois da homologação, preparar o botão do portal HSI para apontar para um APK de release hospedado e versionado.

## Segurança e escopo

- Esta configuração não altera o workflow de GitHub Pages existente.
- Não modifica os serviços de produção do Render.
- O app usa o mesmo Supabase configurado no build web; não cria projeto nem banco novo.
- O artefato inicial é um APK de debug, não um AAB de Google Play.
