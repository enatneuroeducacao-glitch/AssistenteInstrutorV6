# NeuroDrive para Android

O projeto mantém a PWA e a produção web intactas. Os APKs são gerados em GitHub Actions, na branch `feat/neurodrive-android-apk`.

## APK de homologação (debug)

1. Abra **Actions** no GitHub.
2. Execute **Build NeuroDrive Android APK**.
3. Baixe o artefato `neurodrive-android-debug-apk`.

Esse APK serve para testes. A assinatura debug não identifica um editor verificado e pode gerar alertas do Android/Play Protect.

## APK de distribuição (release assinado)

O workflow **Build NeuroDrive Android Release APK** gera um APK release assinado com uma chave própria, e verifica a assinatura antes de publicar o artefato. Ele exige quatro *GitHub Actions secrets* no repositório; sem eles, a compilação deve parar sem gerar um pacote de release:

- `ANDROID_KEYSTORE_BASE64`: conteúdo Base64 do arquivo keystore.
- `ANDROID_KEYSTORE_PASSWORD`: senha do keystore.
- `ANDROID_KEY_ALIAS`: alias da chave.
- `ANDROID_KEY_PASSWORD`: senha da chave.

### Preparar a chave de assinatura

Gere a chave em um computador confiável com Java instalado. Guarde o arquivo `.jks`/ `.keystore` e as senhas em local seguro; **não** faça commit do arquivo, não o envie em mensagens e não o coloque em pastas públicas. Perder essa chave pode impedir que versões futuras atualizem instalações existentes.

Exemplo no terminal (substitua o alias por um nome escolhido por você):

```bash
keytool -genkeypair -v -keystore neurodrive-release.jks -alias neurodrive -keyalg RSA -keysize 2048 -validity 10000
```

Codifique o arquivo em Base64 sem quebras de linha. Em PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\neurodrive-release.jks")) | Set-Clipboard
```

No GitHub, abra **Settings → Secrets and variables → Actions → New repository secret** e crie os quatro secrets acima. Cole o Base64 em `ANDROID_KEYSTORE_BASE64`; use as senhas e alias definidos ao gerar a chave nos demais campos. Não coloque valores secretos em arquivos do repositório ou no workflow.

Depois, em **Actions**, execute manualmente **Build NeuroDrive Android Release APK** e baixe `neurodrive-android-release-apk`. A execução confirma que o APK foi assinado e que a assinatura passa pela verificação técnica.

## Limites importantes

- Um APK assinado com uma chave própria **não remove necessariamente** o aviso de “desenvolvedor desconhecido” ou todos os avisos do Play Protect. Assinatura comprova a continuidade da identidade técnica do pacote, não uma certificação do Google.
- Para reduzir avisos e distribuir de modo oficial, a opção recomendada é publicar pela Google Play, seguindo seus requisitos de conta, verificação e teste.
- Antes de distribuir, testar em um Android real: instalação, login, confirmação de e-mail, navegação, acesso a dados e atualização sobre uma versão anterior.
- Confirmar os redirecionamentos de autenticação do Supabase para o app.
- A produção web/Render, o workflow de Pages e o banco Supabase não são alterados por este fluxo.
