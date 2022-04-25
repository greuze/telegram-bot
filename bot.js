const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');
const fs = require('fs');
const { getClues } = require('./twitter');

// Load env vars
dotenv.config();

// There are no clues on Sunday or Saturday
const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// File that contains guesses from all users
const guessesFile = 'allguesses.json';

// Store here the guesses from users
const guesses = initializeGuessesFile();

// Creates main bot object, that will contain the handlers, etc.
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start(ctx => {
    return ctx.reply(`¡Hola ${ctx.update.message.from.first_name}! ` +
        (ctx.update.message.from.last_name ? `¿O mejor ${ctx.update.message.from.last_name}? ` : '') +
        `¿${ctx.update.message.from.username}? ` +
        `Bueno, da igual, encantado de conocerte 👋🏼👋🏼👋🏼`);
});

const helpMiddleware = ctx => ctx.reply('Escribe /pistas o /clues para ver las pistas de esta semana.\n\n' +
    'Cuando sepas alguna, contesta a ese mensaje con la respuesta y saldrá las siguientes veces que consultes pistas.\n\n' +
    'Si quieres ver las pistas y tus respuestas de una semana anterior, puedes escribir el número de semanas que han pasado después de /pistas o /clues, por ejemplo "/pistas 1" para la semana pasada\n\n' +
    'Suerte 🍀');

bot.help(helpMiddleware);
bot.command('ayuda', helpMiddleware);

const cluesMidleware = ctx => {
    const message = ctx.update.message;
    // Optional pastWeeks parameter will be an integer with the number of weeks to substract or 0 for current week
    // (accepts positive and negative numbers with the same meaning)
    const pastWeeks = Math.abs(parseInt(message.text.split(' ')[1]) || 0);
    getClues(process.env.TWITTER_BEARER_TOKEN, '@depeaparne', pastWeeks)
        .then(async clueList => {
            for (let i = 0; i < clueList.length; i++) {
                const currentClue = clueList[i];
                // If there is info for this day, send the clue or clues for that day, and the guess is exist
                if (currentClue) {
                    const indexDay = `${days[i]} ${currentClue.date}`
                    // Start with a bold day of the week 
                    let clueMessage = `*${indexDay}*\n\n`;

                    // Concatenates clue or clues available for that day
                    clueMessage += currentClue.clues.join('\n\n');
                    // If there is a guess for this user and this day, concatenate at the end
                    const userIndex = message.from.id;
                    if (guesses[userIndex] && guesses[userIndex][indexDay]) {
                        // Hint with length of word(s)
                        const guessLength = getGuessLength(guesses[userIndex][indexDay]);
                        clueMessage += `\n\n_${guesses[userIndex][indexDay]} ${guessLength}_`;
                    }
                    // TODO: Should concatenate here if other users have already the answer?

                    await ctx.replyWithMarkdown(clueMessage);
                }
            }
        }).catch(e => {
            console.error('Unexpected error', e);
            ctx.reply('Algo falló, a mí no me mires... 😵😞🤷🏼');
        });
};
bot.command('clues', cluesMidleware);
bot.command('pistas', cluesMidleware);

bot.on('sticker', ctx => ctx.reply('Mola tu sticker 👍'));

bot.on('text', ctx => {
    const message = ctx.update.message;
    const reply = message.reply_to_message;
    let replies;
    if (reply) {
        // Get the day of the week, removing markdown if exist
        const day = reply.text.split('\n')[0].replace(/\*/g, '');
        const dayOfTheWeek = day.split(' ')[0];
        if (dayOfTheWeek && days.includes(dayOfTheWeek)) {
            // Remove leading and trailing spaces, just in case
            message.text = message.text.trim();
            // Get older guesses from the user, or creates an empty object to put into
            const userIndex = message.from.id;
            const userGuesses = guesses[userIndex] || {};
            userGuesses[day] = message.text;
            guesses[userIndex] = userGuesses;
            // Write guesses to a file to reload on resets
            fs.writeFileSync(guessesFile, JSON.stringify(guesses));
            // Hint with length of word(s)
            const guessLength = getGuessLength(message.text);
            replies = [
                `Ok, me lo apunto, _${message.text} ${guessLength}_ el _${day}_`,
                `Vale ${message.from.first_name}, guardado _${message.text} ${guessLength}_ para el _${day}_`,
                `_${message.text} ${guessLength}_ el _${day}_, entendido`
            ];
        } else {
            // User replied to something not understood (no day with expected format)
            replies = [
                `No sé de qué me hablas, ${message.from.first_name}`,
                '¿Qué quieres que haga con eso?',
                'Respondiste a algo que no entiendo',
                'No sé de qué va esto',
                'Tienes que responder a las pistas'
            ];
        }
    } else {
        // Gossip
        replies = [
            `Qué interesante lo que dices ${message.from.first_name}`,
            `Qué pasada, ${message.from.first_name}`,
            'Es interesante, sí',
            'Me mola',
            `Estoy aprendiendo mucho contigo, ${message.from.first_name}`,
            'Me dejas con los bits temblando'
        ];
    }
    return ctx.replyWithMarkdown(getRandomElement(replies));
});

bot.launch();

function initializeGuessesFile() {
    try {
        let rawdata = fs.readFileSync(guessesFile);
        return JSON.parse(rawdata);
    } catch (error) {
        console.log(`Guesses file ${guessesFile} does not exist, initializing to empty`)
        return {};
    }
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Print user friendly length of words
 *
 * @param {string} guess User guess answer to a clue
 * @returns User friendly length of word or words
 */
function getGuessLength(guess) {
    const guessWords = guess.split(' ');
    let length;
    if (guessWords.length > 1) {
        // For example, "3 palabras de 3, 5 y 4 letras"
        length = `${guessWords.length} palabras de ${guessWords[0].length}`;
        for (let i = 1; i < guessWords.length - 1; i++) {
            length += `, ${guessWords[i].length}`;
        }
        length += ` y ${guessWords[guessWords.length - 1].length} letras`;
    } else {
        // For example, "11 letras"
        length = guessWords[0].trim().length + ' letras';
    }
    return `(${length})`;
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
