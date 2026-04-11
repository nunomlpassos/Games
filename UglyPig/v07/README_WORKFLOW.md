# UglyPig v5 - Workflow rápido

## Como correr localmente

```bash
cd C:\Users\nuno_\Documents\GIT\Games\UglyPig\v5
npm install
npm run dev
```

Abre o URL mostrado no terminal (normalmente `http://localhost:5173`).

## Como validar build de produção

```bash
npm run build
```

## Checklist de testes (rápido)

### Som
- [ ] Clica para mudar direção -> deve tocar som curto
- [ ] Passa um obstáculo -> deve tocar som de score
- [ ] Bate num obstáculo/parede -> deve tocar som de impacto
- [ ] Pause -> Sound OFF -> repetir os 3 testes -> sem som

### Vibração
- [ ] Em dispositivo com vibração, ao pontuar deve vibrar curto
- [ ] Em game over deve vibrar padrão mais forte
- [ ] Pause -> Vibration OFF -> repetir -> sem vibração

### Score
- [ ] Contador aparece dentro do jogo, em baixo e centrado
- [ ] Contador aumenta ao passar obstáculos
- [ ] Last Run atualiza ao reiniciar
- [ ] Best (Top score) persiste entre refresh/reabertura

### Game Over
- [ ] Overlay aparece corretamente
- [ ] Mostra Score, Last Run e Best
- [ ] Tap/Click/Space reinicia jogo

### Pause
- [ ] Botão Pause abre menu
- [ ] Menu de Pause mostra Score, Last Run e Best
- [ ] Retomar inicia countdown 3..2..1 e só depois retoma
- [ ] Reiniciar inicia countdown 3..2..1 e só depois reinicia
- [ ] Botões de som/vibração só aparecem no menu de Pause
