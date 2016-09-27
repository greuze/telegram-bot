'use strict'

'use strict'

var TOKEN = process.env.TELEGRAM_BOT_TOKEN || require('./config.json').token;
var tg = require('telegram-node-bot')(TOKEN);

tg.router
    .when(['ping', 'start'], 'BasicController')
    .otherwise('OtherwiseController');

tg.controller('BasicController', ($) => {
    tg.for('ping', () => {
        $.sendMessage('pong');
    });
    tg.for('start', () => {
        $.sendMessage('Hola ' + $.message.from.first_name + ', ¡bienvenido!');
    });
    console.log('Got message "%s" from "%s %s"',
        $.message.text, $.message.from.first_name, $.message.from.last_name);
});

tg.controller('OtherwiseController', ($) => {
    console.log('Got unknown message "%s" from "%s %s"',
        $.message.text, $.message.from.first_name, $.message.from.last_name);
});
