# Video Chat

Video call 1:1 no browser — UI estilo Google Meet, WebRTC via PeerJS.

Built by [Marcos Mendes](https://www.instagram.com/mendes.tsx/).

## Features

- Chamada 1:1 com link compartilhável (`/?room=vc-xxxxxxxx`)
- Entrar com código ou URL na tela inicial
- Layouts: spotlight (PiP) ou side-by-side 50/50
- Controles: mic, câmera, volume remoto, fullscreen
- Video fit flutuante (Fill / Fit) no hover do vídeo
- Seleção de câmera e microfone (persiste no `localStorage`)
- Mirror da câmera local e opção de ocultar self-view
- Desconexão limpa quando alguém sai (sem frame travado)
- Pronto para testar via Ngrok em dois devices

## Stack

- Vite + TypeScript
- PeerJS (PeerServer público)
- WebRTC / `getUserMedia`

## Requisitos

- Node.js 18+
- Chrome, Firefox ou Safari
- [Ngrok](https://ngrok.com/) para testar fora do localhost

## Setup

```bash
npm install
npm run dev
```

App em `http://localhost:5173` (`host: true`, hosts Ngrok liberados).

## Teste com Ngrok

```bash
npm run dev
# outro terminal
ngrok http 5173
```

1. Abra a URL HTTPS do Ngrok no **Browser A**
2. Clique em **New meeting** → permita câmera/mic → **Copy link**
3. No **Browser B** (ou outro device), cole o link ou use **Join** com o código
4. Clique em **Join now**

> Use dois perfis / janela anônima para simular dois usuários na mesma máquina.  
> HTTPS é obrigatório para mídia fora de `localhost`.

## Scripts

```bash
npm run dev      # desenvolvimento
npm run build    # typecheck + build
npm run preview  # preview do build
```

## Estrutura

```
videochat/
  inspiration-layout/   # referência visual original
  src/
    peer/               # PeerJS, media, call session
    ui/                 # shell Meet, layout, settings
    utils/              # roomId, clipboard
```

## Segurança

- `room` validado com `^vc-[a-z0-9]{8}$`
- `getUserMedia` só após clique do usuário
- Sem secrets no código

## Notas

- Usa o PeerServer público do PeerJS (ok para demo; em produção use um PeerServer próprio).
- Preferências de layout/devices ficam no `localStorage` do browser.
