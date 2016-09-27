'use strict'

const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || require('./config.json').token;
const tg = new Telegram.Telegram(TOKEN)

class BasicController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    pingHandler($) {
        $.sendMessage('pong');
    }

    startHandler($) {
        $.sendMessage('Hola ' + $._message._from._firstName + ', ¡bienvenido!');
    }

    get routes() {
        return {
            'ping': 'pingHandler',
            'start': 'startHandler'
        };
    }
}

class OtherwiseController extends TelegramBaseController {
    handle($) {
        console.log('Got unknown message "%s" from "%s %s"',
            $._message._text, $._message._from._firstName, $._message._from._lastName);
        $.sendMessage('I don\'t understand "' + $._message._text + '"');
    }
}

tg.router
    .when(['ping', 'start'], new BasicController())
    .otherwise(new OtherwiseController());
