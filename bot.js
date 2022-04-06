const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');
const { getClues } = require('./twitter');

// Load env vars
dotenv.config();

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Creates main bot object, that will contain the handlers, etc.
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start(ctx => {
    return ctx.reply(`¡Hola ${ctx.update.message.from.first_name}! ` +
        (ctx.update.message.from.last_name ? `¿O mejor ${ctx.update.message.from.last_name}? ` : '') +
        `¿${ctx.update.message.from.username}? ` +
        `Bueno, da igual, encantado de conocerte 👋🏼👋🏼👋🏼`);
});

bot.help(ctx => ctx.reply('Puedo ayudarte en casi todo, menos limpiar baños 😵😞🤷🏼'));

bot.command('clues', ctx => {
    getClues(process.env.TWITTER_BEARER_TOKEN, '@depeaparne')
        .then(async clueList => {
            for (let i = 0; i < clueList.length; i++) {
                const clue = clueList[i];
                if (clue) {
                    await ctx.reply(days[i] + ':\n' + clue.join('\n') + '\n');
                }
            }
        }).catch(e => {
            console.error('Unexpected error', e);
            ctx.reply('Something bad happened');
        });;
});

bot.on('sticker', ctx => ctx.reply('Mola tu sticker 👍'));

bot.on('text', ctx => {
    console.log(ctx.update.message);
    const replies = [
        `Qué interesante lo que dices ${ctx.update.message.from.first_name}`,
        `Qué pasada, ${ctx.update.message.from.first_name}`,
        'Es interesante, sí',
        'Me mola',
        `Estoy aprendiendo mucho contigo, ${ctx.update.message.from.first_name}`,
        'Me dejas con los bits temblando'
    ];
    return ctx.reply(getRandomElement(replies));
});

bot.launch();

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Unhandled errors
process.on('uncaughtException', (error) => {
    console.error('UncaughtException', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UnhandledRejection', reason);
    process.exit(1);
});
