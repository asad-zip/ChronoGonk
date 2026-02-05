//Load env variables 
require('dotenv').config();

//import discord.js lib
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

//create new discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ]
});

//command runs once the bot is connected
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Chronogonk is online, choom!');
});

//runs when someone messages
client.on('messageCreate', message => {
    //ignore messages from bots
    if (message.author.bot) return;

    //respond to a specific command
    if (message.content === '!ping') {
        message.channel.send('Pong, gonk');
    }
});

//login to discord with bot token
client.login(process.env.DISCORD_BOT_TOKEN);
