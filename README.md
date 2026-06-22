# Bot WhatsApp

Bot de WhatsApp simples, organizado e gratuito, feito com Node.js e [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). No horário agendado (via cron), envia para um ou mais grupos uma enquete e mantém atualizada (editando a mensagem) a lista de inscritos do jogo, com vagas numeradas e lista de espera automática quando as vagas acabam. Cada grupo pode usar um **modo** diferente: `individual` (uma pessoa por vaga, ex. vôlei de quadra) ou `duplas` (duas pessoas por vaga, ex. vôlei de areia). Mantém sessão persistente (não precisa escanear o QR Code todas as vezes).

## Dependências

- [Node.js](https://nodejs.org/) 18 ou superior
- [whatsapp-web.js](https://www.npmjs.com/package/whatsapp-web.js) — integração com o WhatsApp Web
- [node-cron](https://www.npmjs.com/package/node-cron) — agendamento de tarefas via expressão cron
- [qrcode-terminal](https://www.npmjs.com/package/qrcode-terminal) — exibição do QR Code no terminal
- [dotenv](https://www.npmjs.com/package/dotenv) — carregamento das variáveis de ambiente
- [nodemon](https://www.npmjs.com/package/nodemon) (dev) — reinício automático durante o desenvolvimento

## Instalação

```bash
npm install
```

## Configuração

Edite o arquivo `.env` na raiz do projeto. O bot suporta um ou vários grupos, cada um com seu próprio modo, dia/horário de jogo e dados de pagamento, todos recebendo a enquete no mesmo agendamento:

```env
GROUP_ID_1=120363423127751440@g.us
GAME_MODE_1=individual
GAME_WEEKDAY_1=sabado
GAME_TIME_1=20h às 23h
PRICE_1=R$ 12,00
PIX_KEY_1=98 99107-9812 (PAN)
PIX_NAME_1=Monick de Araújo Cicilio dos Santos 🏐

GROUP_ID_2=120363427441112948@g.us
GAME_MODE_2=duplas
GAME_WEEKDAY_2=quarta
GAME_TIME_2=20h às 22h
PRICE_2=R$ 16,00
PIX_KEY_2=98 99183-0333 (BB)
PIX_NAME_2=Ana Clara Costa de Oliveira 🏐

SCHEDULE=0 9 * * 0
TIMEZONE=America/Fortaleza
POLL_DEBOUNCE_SECONDS=5
```

| Variável                 | Descrição                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `GROUP_ID_<n>`            | ID do grupo número `<n>` que receberá a enquete (veja como obter abaixo).           |
| `GAME_MODE_<n>`           | Modo da lista desse grupo: `individual` (uma pessoa por vaga) ou `duplas` (duas pessoas por vaga). Padrão: `individual`. |
| `GAME_WEEKDAY_<n>`        | Dia da semana do jogo desse grupo (`domingo`, `segunda`, `terca`, `quarta`, `quinta`, `sexta`, `sabado`). Usado para calcular sempre a próxima data desse dia no cabeçalho da lista. |
| `GAME_TIME_<n>`           | Horário do jogo desse grupo, exibido como texto livre (ex.: `20h às 23h`).          |
| `PRICE_<n>`               | Valor cobrado por pessoa/dupla nesse grupo, exibido no rodapé da lista.            |
| `PIX_KEY_<n>`             | Chave Pix exibida no rodapé da lista desse grupo.                                  |
| `PIX_NAME_<n>`            | Nome do titular do Pix exibido no rodapé da lista desse grupo.                     |
| `SCHEDULE`                | Expressão cron que define quando a enquete será enviada (vale para todos os grupos). |
| `TIMEZONE`                | Fuso horário usado para calcular o agendamento.                                     |
| `POLL_DEBOUNCE_SECONDS`   | Tempo de espera (em segundos) sem novos votos antes de atualizar a lista. Evita uma edição por clique quando várias pessoas votam ao mesmo tempo. Padrão: `5`. |

Para adicionar mais grupos, basta continuar a numeração (`GROUP_ID_3`, `GAME_MODE_3`, etc). Se preferir um único grupo, também é possível usar as variáveis sem número, `GROUP_ID`/`GAME_MODE`/`GAME_WEEKDAY`/`GAME_TIME`/`PRICE`/`PIX_KEY`/`PIX_NAME` (formato legado, mantido por compatibilidade).

## Como executar

### Produção

```bash
npm start
```

### Desenvolvimento (com reinício automático via nodemon)

```bash
npm run dev
```

Na primeira execução, um QR Code será exibido no terminal. Escaneie com o WhatsApp (em **Aparelhos conectados > Conectar um aparelho**). A sessão é salva na pasta `auth/`, então não será necessário escanear novamente nas próximas execuções, a menos que a sessão seja removida ou expire.

## Como descobrir o ID de um grupo

1. Inicie o bot normalmente (`npm run dev` ou `npm start`) e aguarde a mensagem `WhatsApp conectado.`.
2. Em qualquer conversa (pode ser no próprio grupo ou em uma conversa privada), envie o comando:

   ```
   !groups
   ```

3. No terminal onde o bot está rodando, será exibida a lista de todos os grupos, no formato:

   ```
   Nome do grupo: Nome do Grupo
   ID do grupo: 1234567890-1234567890@g.us
   ---
   ```

4. Copie o `ID do grupo` desejado e cole no campo `GROUP_ID_<n>` (por exemplo `GROUP_ID_1`, `GROUP_ID_2`) do arquivo `.env`.
5. Reinicie o bot para que a nova configuração seja aplicada.

## Como alterar o horário do envio

Altere o valor de `SCHEDULE` no `.env` usando uma expressão cron (`minuto hora dia-do-mes mes dia-da-semana`). Exemplos:

| Expressão       | Significado                          |
| --------------- | ------------------------------------- |
| `0 9 * * 0`     | Todo domingo às 09:00                |
| `0 8 * * 1-5`   | De segunda a sexta às 08:00          |
| `30 18 * * *`   | Todos os dias às 18:30               |
| `0 0 1 * *`     | No primeiro dia de cada mês à meia-noite |

Ajuste também o `TIMEZONE` se necessário (lista de fusos disponível em [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)).

Após alterar o `.env`, reinicie o bot para aplicar a nova configuração.

## Enquete e lista do jogo

No horário definido em `SCHEDULE`, o bot envia para cada grupo configurado uma enquete e, em seguida, a lista do jogo — no formato definido pelo `GAME_MODE_<n>` daquele grupo.

### Modo `individual` (uma pessoa por vaga)

Enquete com a pergunta **"Quer?"** e as opções **Levantador**, **Lista de presença** e **Lista de espera**. Lista no formato:

```
📌 LISTA COLMEIA – QUADRA
🗓️ Sábado – 27/06
🕗 20h às 23h

> LEVANTADORES
01 - 
02 - 
03 - 
04 - 

> LISTA DE PRESENÇA
05 - 
...
24 - 

> LISTA DE ESPERA

🚨 ATENÇÃO: Para garantirmos a reserva, o pagamento deverá ser feito até terça-feira (terça-feira da semana). Desde já agradecemos a colaboração de todos!

Valor: R$ 12,00
Pix: 98 99107-9812 (PAN)
Monick de Araújo Cicilio dos Santos 🏐
```

- Coloca o nome na próxima vaga livre da seção escolhida (**Levantador** → vagas 01 a 04, **Lista de presença** → vagas 05 a 24).
- Se a seção escolhida estiver sem vagas, coloca o nome automaticamente na **Lista de espera**.
- Se a pessoa votar diretamente em **Lista de espera**, o nome vai para lá, independente de haver vagas livres.

### Modo `duplas` (duas pessoas por vaga)

Enquete com a pergunta **"Quer?"** e as opções **Dupla 1** a **Dupla 5** e **Lista de espera**. Lista no formato:

```
📌 ARENA CRONOS – AREIA
🏐 DUPLA MISTA
🗓️ Quarta-feira – 24/06
🕗 20h às 22h

> ganhou duas sai uma e volta na próxima
> desafiado marca placar

01 - 
02 - 
03 - 
04 - 
05 - 

> LISTA DE ESPERA

Valor: R$ 16,00
Pix: 98 99183-0333 (BB)
Ana Clara Costa de Oliveira 🏐
```

- Cada vaga (`01` a `05`) leva até 2 pessoas; quando as duas primeiras votam na mesma opção (ex.: **Dupla 1**), elas aparecem juntas como `Pessoa1 e Pessoa2`.
- Se uma 3ª pessoa votar numa dupla que já está completa, o voto é ignorado (com aviso no console) — ela precisa escolher outra dupla ou a Lista de Espera.
- Na **Lista de Espera**, os nomes são pareados de 2 em 2 na ordem de chegada (`- Pessoa1 e Pessoa2`, `- Pessoa3 e Pessoa4`...); se houver um número ímpar, o último nome aparece sozinho até a próxima pessoa entrar.

### Comum aos dois modos

- Se a pessoa trocar o voto, o nome é removido da seção/vaga anterior e movido para a nova escolha.
- Se a pessoa desmarcar o voto (sem nenhuma opção selecionada), o nome é removido da lista, liberando a vaga.
- Para evitar uma edição por clique quando várias pessoas votam ao mesmo tempo, o bot aguarda alguns segundos sem novos votos (`POLL_DEBOUNCE_SECONDS`, padrão 5s) antes de atualizar a lista — e a lista sempre reflete o estado atual completo (cumulativo), não apenas os votos mais recentes.

**Importante:** o WhatsApp só permite editar uma mensagem por um tempo limitado depois de enviada (geralmente alguns minutos) — essa é uma regra do próprio WhatsApp, não da biblioteca. Por isso, sempre que a edição não for mais possível, o bot detecta isso automaticamente e envia uma **nova** mensagem com a lista atualizada, passando a editar essa nova mensagem a partir daí. Ou seja, a lista de uma semana pode acabar virando duas ou três mensagens ao longo dos dias, mas sempre estará atualizada.

## Comandos disponíveis

- `!ping` — o bot responde `Pong!`. Útil para verificar se o bot está online.
- `!groups` — lista no console o nome e o ID de todos os grupos da conta conectada. Use para descobrir o `GROUP_ID` a ser configurado no `.env`.
- `!add Nome da pessoa` — adiciona manualmente alguém na lista mais recente daquele grupo (ex.: alguém que não está no grupo e por isso não pode votar na enquete). Sem palavra-chave, entra na próxima vaga livre da seção padrão (**Lista de presença** no modo `individual`, próxima dupla livre no modo `duplas`), com o mesmo overflow para a Lista de Espera que um voto normal teria.
- `!add <chave> Nome da pessoa` — mesma coisa, mas escolhendo a seção manualmente:
  - Modo `individual`: `lev`/`levantador` (Levantadores), `presenca` (Lista de Presença), `espera` (Lista de Espera). Ex.: `!add lev Carlos Silva`.
  - Modo `duplas`: `d1` a `d5` (ou `dupla1` a `dupla5`) para uma dupla específica, `espera` para a Lista de Espera. Ex.: `!add d3 Fulano de Tal`.
- `!remove Nome da pessoa` — procura esse nome na lista mais recente daquele grupo (sem diferenciar maiúsculas/minúsculas) e remove de onde estiver, liberando a vaga. Funciona tanto para quem foi adicionado com `!add` quanto para quem votou na enquete.

Os comandos `!add` e `!remove` devem ser enviados dentro do próprio grupo (não numa conversa privada), e afetam a lista mais recente já enviada para aquele grupo.

## Estrutura do projeto

```
bot-whatsapp/
│
├── src/
│   ├── index.js        # ponto de entrada da aplicação
│   ├── client.js        # configuração do cliente whatsapp-web.js, QR Code e comandos
│   ├── scheduler.js      # agendamento e envio da enquete via node-cron
│   ├── pollTracker.js    # gerencia vagas/lista de espera por voto e edita a lista (debounce)
│   ├── config.js         # leitura das variáveis de ambiente
│   ├── modes/
│   │   ├── index.js      # seleciona o modo (individual/duplas) de cada grupo
│   │   ├── individual.js # formato "uma pessoa por vaga" (ex.: vôlei de quadra)
│   │   └── duplas.js     # formato "duas pessoas por vaga" (ex.: vôlei de areia)
│   └── utils/
│       ├── logger.js     # utilitário de logs padronizados
│       └── weekday.js    # calcula a próxima data de um dia da semana
│
├── auth/                  # sessão salva do WhatsApp (gerado automaticamente)
├── package.json
├── .gitignore
├── README.md
├── .env.example
└── .env
```

## Observações

- A pasta `auth/` contém dados sensíveis da sessão autenticada — ela já está listada no `.gitignore` e não deve ser versionada nem compartilhada.
- Caso a sessão expire ou apresente erro de autenticação, apague o conteúdo da pasta `auth/` e reinicie o bot para gerar um novo QR Code.
