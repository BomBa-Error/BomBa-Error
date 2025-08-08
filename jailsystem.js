const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.DIRECT_MESSAGES
    ] 
});

// Config bé IDs
const config = {
    bannedTeamRoleID: "1402788579855302822", // Rôle admin
    jailRoleID: "1403394457973297383", // Rôle jail
    logsChannelID: "1402788861289169008" // Channel logs
};

const prefix = "+";
const userRoles = new Map(); // Stockage roles w reasons

client.on('ready', () => {
    console.log(`Bot mconnecti: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // +hbs [@user] [raison] - Jail command
    if (command === 'hbs') {
        if (!message.member.roles.cache.has(config.bannedTeamRoleID)) {
            return message.reply("Mabghitich tdir had commande!");
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply("Sayb li bghiti tjaili!");
        }

        if (args.length < 2) {
            return message.reply("Zid raison dial jail! Syntax: +hbs @user [raison]");
        }

        const reason = args.slice(1).join(" ");

        if (member.roles.cache.has(config.jailRoleID)) {
            return message.reply("Hada déja msjon!");
        }

        // Save roles + reason + timestamp
        userRoles.set(member.id, {
            roles: member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.id),
            jailedBy: message.author.id,
            reason: reason,
            jailedAt: new Date()
        });

        try {
            await member.roles.set([config.jailRoleID]);
            
            // DM l user jailé
            try {
                const dmEmbed = new MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('⛔ rak jailiti doz choife 3lach')
                    .setDescription(`rak me jaili fe ${message.guild.name}`)
                    .addField('Raison:', reason)
                    .addField('Admin:', message.author.tag)
                    .setTimestamp();
                
                await member.send({ embeds: [dmEmbed] });
            } catch (err) {
                console.log("User makayftahch DMs");
            }

            // Log f channel
            const logsChannel = message.guild.channels.cache.get(config.logsChannelID);
            if (logsChannel) {
                const logEmbed = new MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('🔴 JAIL LOG')
                    .setDescription(`${member.user.tag} (\`${member.id}\`) tsayb msjon`)
                    .addFields(
                        { name: 'Jailed by', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                        { name: 'Raison', value: reason, inline: true },
                        { name: 'Time', value: new Date().toLocaleString(), inline: true }
                    )
                    .setTimestamp();
                
                await logsChannel.send({ embeds: [logEmbed] });
            }

            message.reply(`✅ Tsaybti ${member.user.tag} msjon b njah! Raison: ${reason}`);
        } catch (error) {
            console.error(error);
            message.reply("❌ Wa had error f jail!");
        }
    }

    // +ifrag [@user] - Free command
    if (command === 'ifrag') {
        if (!message.member.roles.cache.has(config.bannedTeamRoleID)) {
            return message.reply("Mabghitich tdir had commande!");
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply("Sayb li bghiti tfrej!");
        }

        if (!member.roles.cache.has(config.jailRoleID)) {
            return message.reply("Hada machi msjon!");
        }

        const jailData = userRoles.get(member.id);
        if (!jailData) {
            return message.reply("Mafihsh data, imken kan free manual!");
        }

        try {
            await member.roles.set(jailData.roles);
            
            // DM l user free
            try {
                const freeEmbed = new MessageEmbed()
                    .setColor('#00FF00')
                    .setTitle('✅ rah salat le moda dial 3okoba dialk!')
                    .setDescription(`rah te hiyed lik jail fe ${message.guild.name}`)
                    .addField('Jail Duration', formatDuration(new Date() - jailData.jailedAt))
                    .setTimestamp();
                
                await member.send({ embeds: [freeEmbed] });
            } catch (err) {
                console.log("User makayftahch DMs");
            }

            // Log f channel
            const logsChannel = message.guild.channels.cache.get(config.logsChannelID);
            if (logsChannel) {
                const freeLogEmbed = new MessageEmbed()
                    .setColor('#00FF00')
                    .setTitle('🟢 FREE LOG')
                    .setDescription(`${member.user.tag} (\`${member.id}\`) free from msjon`)
                    .addFields(
                        { name: 'Freed by', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                        { name: 'Original Reason', value: jailData.reason, inline: true },
                        { name: 'Jail Duration', value: formatDuration(new Date() - jailData.jailedAt), inline: true }
                    )
                    .setTimestamp();
                
                await logsChannel.send({ embeds: [freeLogEmbed] });
            }

            userRoles.delete(member.id);
            message.reply(`✅ Free from jail ${member.user.tag} b njah!`);
        } catch (error) {
            console.error(error);
            message.reply("❌ Wa had error f free!");
        }
    }
});

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

client.login('TOKEN_DIAL_BOT');