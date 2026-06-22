# Bot WhatsApp

Bot de WhatsApp simples, organizado e gratuito, feito com Node.js e [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). Envia uma mensagem agendada para um grupo do WhatsApp usando expressões cron, com sessão persistente (não precisa escanear o QR Code todas as vezes).

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

Edite o arquivo `.env` na raiz do projeto. O bot suporta um ou vários grupos, cada um com sua própria mensagem, todos disparados no mesmo agendamento:

```env
GROUP_ID_1=120363423127751440@g.us
MESSAGE_1=Bom dia, grupo! Esta e uma mensagem automatica.

GROUP_ID_2=120363427441112948@g.us
MESSAGE_2=bom dia grupo 2

SCHEDULE=0 9 * * 0
TIMEZONE=America/Fortaleza
```

| Variável         | Descrição                                                                          |
| ---------------- | ------------------------------------------------------------------------------------ |
| `GROUP_ID_<n>`   | ID do grupo número `<n>` que receberá uma mensagem (veja como obter abaixo).        |
| `MESSAGE_<n>`    | Texto da mensagem enviada para o grupo `GROUP_ID_<n>`.                              |
| `SCHEDULE`       | Expressão cron que define quando as mensagens serão enviadas (vale para todos os grupos). |
| `TIMEZONE`       | Fuso horário usado para calcular o agendamento.                                     |

Para adicionar mais grupos, basta continuar a numeração (`GROUP_ID_3`/`MESSAGE_3`, `GROUP_ID_4`/`MESSAGE_4`, etc). Se preferir um único grupo, também é possível usar as variáveis sem número, `GROUP_ID` e `MESSAGE` (formato legado, mantido por compatibilidade).

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

## Como alterar a mensagem

Edite o valor de `MESSAGE_<n>` (ex.: `MESSAGE_1`, `MESSAGE_2`) referente ao grupo desejado no arquivo `.env` com o texto desejado e reinicie o bot.

## Comandos disponíveis

- `!ping` — o bot responde `Pong!`. Útil para verificar se o bot está online.
- `!groups` — lista no console o nome e o ID de todos os grupos da conta conectada. Use para descobrir o `GROUP_ID` a ser configurado no `.env`.

## Estrutura do projeto

```
bot-whatsapp/
│
├── src/
│   ├── index.js        # ponto de entrada da aplicação
│   ├── client.js        # configuração do cliente whatsapp-web.js, QR Code e comandos
│   ├── scheduler.js      # agendamento e envio da mensagem via node-cron
│   ├── config.js         # leitura das variáveis de ambiente
│   └── utils/
│       └── logger.js     # utilitário de logs padronizados
│
├── auth/                  # sessão salva do WhatsApp (gerado automaticamente)
├── package.json
├── .gitignore
├── README.md
└── .env
```

## Observações

- A pasta `auth/` contém dados sensíveis da sessão autenticada — ela já está listada no `.gitignore` e não deve ser versionada nem compartilhada.
- Caso a sessão expire ou apresente erro de autenticação, apague o conteúdo da pasta `auth/` e reinicie o bot para gerar um novo QR Code.
