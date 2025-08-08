const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });

// Base de données
const warnsDB = new Map();
let warnCounter = 1;

client.on('ready', () => {
    console.log(`Bot mconnecti: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // +warn
    if (command === '+warn') {
        // Check staff
        if (!message.member.roles.cache.some(role => role.name === 'Staff')) {
            return message.reply('❌ Khassk tkoun staff bach dir hadi!');
        }

        // Check mention
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('❌ Sift li bghiti twarnih!');
        }

        // Ma tdir warn l rassek
        if (member.id === message.author.id) {
            return message.reply('❌ Wach katwarn rassek? Haha!');
        }

        // Raison obligatoire
        if (args.length < 2) {
            return message.reply('❌ Goltik raison! (+warn @user raison)');
        }
        const reason = args.slice(1).join(' ');

        // Zid warn
        const warnId = warnCounter++;
        const warnData = {
            id: warnId,
            moderator: message.author.id,
            reason: reason,
            date: new Date()
        };

        if (!warnsDB.has(member.id)) {
            warnsDB.set(member.id, []);
        }
        warnsDB.get(member.id).push(warnData);

        // Ila 3ndo 3 warns
        const userWarns = warnsDB.get(member.id);
        if (userWarns.length >= 3) {
            try {
                await member.Jail(`3 warns (ID warn: ${warnId})`);
                
                const kickEmbed = new MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('⚡ Twahchtih!')
                    .setDescription(`${member.user.tag} twahch bach wsél 3 warns`)
                    .addField('Last warn', `ID: ${warnId}\nRaison: ${reason}`)
                    .setTimestamp();
                
                return message.channel.send({ embeds: [kickEmbed] });
            } catch (error) {
                console.error('Error f kick:', error);
                return message.reply('❌ Maqdirch twahch (permissions)');
            }
        }

        // Zid rôle Warned
        let warnedRole = message.guild.roles.cache.find(r => r.name === 'Warned');
        if (!warnedRole) {
            warnedRole = await message.guild.roles.create({
                name: 'Warned',
                color: '#FF0000',
                reason: 'Role l warned members'
            });
        }
        await member.roles.add(warnedRole);

        // Confirmation
        const embed = new MessageEmbed()
            .setColor('#FFA500')
            .setTitle('⚠ Jey warn jdid')
            .addFields(
                { name: 'ID', value: warnId.toString(), inline: true },
                { name: 'Raison', value: reason, inline: true },
                { name: 'Modo', value: message.author.tag, inline: true },
                { name: 'Total warns', value: userWarns.length.toString(), inline: true }
            )
            .setFooter(`3 warns = twahch automatik`)
            .setTimestamp();

        message.channel.send({ embeds: [embed] });

        // B3at DM
        try {
            const dmEmbed = new MessageEmbed()
                .setColor('#FFA500')
                .setTitle('⚠ Twarniti!')
                .setDescription(`F serveur ${message.guild.name}`)
                .addFields(
                    { name: 'ID', value: warnId.toString(), inline: true },
                    { name: 'Raison', value: reason, inline: true },
                    { name: 'Total warns', value: userWarns.length.toString(), inline: true }
                )
                .setFooter(`3 warns = twahch automatik`)
                .setTimestamp();

            await member.send({ embeds: [dmEmbed] });
        } catch (err) {
            console.error(`Maqdirch b3at DM: ${err}`);
        }

        // Logs
        const logChannel = message.guild.channels.cache.get('ID_CHANNEL_LOGS');
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    }

    // +unwarn
    if (command === '+unwarn') {
        // Check staff
        if (!message.member.roles.cache.some(role => role.name === 'Staff')) {
            return message.reply('❌ Khassk tkoun staff bach dir hadi!');
        }

        // Check args
        if (args.length < 1) {
            return message.reply('❌ Sift ID dial warn bach temchiw (+unwarn ID)');
        }
        const warnId = parseInt(args[0]);

        // Qelleb 3la warn
        let targetMember = null;
        let warnIndex = -1;
        
        for (const [memberId, warns] of warnsDB) {
            const foundIndex = warns.findIndex(w => w.id === warnId);
            if (foundIndex !== -1) {
                targetMember = memberId;
                warnIndex = foundIndex;
                break;
            }
        }

        if (!targetMember || warnIndex === -1) {
            return message.reply('❌ Maqdirch nqelleb 3la had warn!');
        }

        // Temchi warn
        const member = await message.guild.members.fetch(targetMember);
        const removedWarn = warnsDB.get(targetMember).splice(warnIndex, 1)[0];

        // Ila ma b9a warn, emchi rôle
        if (warnsDB.get(targetMember).length === 0) {
            const warnedRole = message.guild.roles.cache.find(r => r.name === 'Warned');
            if (warnedRole && member.roles.cache.has(warnedRole.id)) {
                await member.roles.remove(warnedRole);
            }
        }

        // Confirmation
        const embed = new MessageEmbed()
            .setColor('#00FF00')
            .setTitle('✅ Warn msa7')
            .addFields(
                { name: 'ID', value: warnId.toString(), inline: true },
                { name: 'Member', value: member.user.tag, inline: true },
                { name: 'Raison dial warn', value: removedWarn.reason, inline: true },
                { name: 'Modo li warna', value: `<@${removedWarn.moderator}>`, inline: true },
                { name: 'Warns li b9aw', value: warnsDB.get(targetMember).length.toString(), inline: true }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });

        // Logs
        const logChannel = message.guild.channels.cache.get('ID_CHANNEL_LOGS');
        if (logChannel) {
            logChannel.send({ embeds: [embed] });
        }
    }

    // warns
    if (command === 'warns') {
        const target = message.mentions.members.first() || message.member;
        const warns = warnsDB.get(target.id) || [];

        const embed = new MessageEmbed()
            .setColor(warns.length ? '#FFA500' : '#00FF00')
            .setTitle(`📝 Warns dyal ${target.user.tag}`)
            .setDescription(warns.length 
                ? `Total warns: ${warns.length} (3 = twahch automatik)` 
                : 'Makayn warn!');

        warns.forEach(warn => {
            embed.addField(
                `Warn #${warn.id}`,
                `**Date:** ${warn.date.toLocaleString()}\n` +
                `**Modo:** <@${warn.moderator}>\n` +
                `**Raison:** ${warn.reason}`
            );
        });

        message.channel.send({ embeds: [embed] });
    }
});

client.login('TOKEN_DYALEK');