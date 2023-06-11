//dotenvの適用
require("dotenv").config();
//.envからtokenの呼び出し
const { token } = process.env;
const fs = require("fs");
const Keyv = require("keyv");
const client = require("./objects/client");
const Raimu = require("./classes/raimu_class");
const messages = require("./objects/messages");

//データベース定義
const server = new Keyv("sqlite://db.sqlite", { table: "server" });

//グローバル変数の定義
global.battles = {};

const commands = {};

//コマンドのファイルを読み込む
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands[command.data.name] = command;
}

//起動確認
client.once("ready", async () => {
  const data = [];
  for (const commandName in commands) {
    data.push(commands[commandName].data);
  }
  await client.application.commands.set(data);
  console.log(`${client.user.tag} を起動しています...`);
});

//コマンド実行時の処理
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  await interaction.deferReply({ ephemeral: true });
  const command = commands[interaction.commandName];
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

//メンバーが参加した時の処理
client.on("guildMemberAdd", async (member) => {
  const guild = member.guild;
  const serverInfo = await server.get(guild.id);
  if (!serverInfo.settings.welcome_message) return;
  guild.systemChannel.send(`<@!${member.id}>さん、${guild.name}へようこそ！`);
});

//サーバーに参加した時の処理
client.on("guildCreate", async (guild) => {
  const settings = {
    welcome_message: true,
  };
  await server.set(guild.id, { operator: [guild.ownerId], settings: settings });
});

//サーバーから削除された時の処理
client.on("guildDelete", async (guild) => {
  await server.delete(guild.id);
});

//Discordへの接続
client.login(token);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  await interaction.deferReply({ ephemeral: true });
  const customId = interaction.customId;
  const channelId = interaction.channelId;
  const guildId = interaction.guildId;
  if (customId === "mc1_select" || customId === "mc2_select") {
    await interaction.editReply(
      battles[guildId][channelId][0].selectMc(customId, interaction.user)
    );
    return;
  }
  if (!(await Raimu.operatorCheck(interaction.guild, interaction.member))) {
    await interaction.editReply(messages.fail("権限がありません。"));
    return;
  }
  if (customId === "order_change") {
    await interaction.editReply(battles[guildId][channelId][0].orderChange());
  } else if (customId === "battle_judge") {
    await interaction.editReply(battles[guildId][channelId][0].judge());
  } else if (customId === "battle_result") {
    await interaction.editReply(battles[guildId][channelId][0].result());
  } else if (customId === "battle_restart") {
    await interaction.editReply(
      battles[guildId][channelId][0].restart(guildId)
    );
  } else if (customId === "battle_stop" || customId === "battle_finish") {
    switch (customId) {
      case "battle_stop":
        await interaction.editReply(battles[guildId][channelId][0].delete());
        break;
      case "battle_finish":
        await interaction.editReply(
          battles[guildId][channelId][0].finish(guildId)
        );
        break;
    }
    if (battles[guildId][channelId].length > 0) {
      await battles[guildId][channelId][0].create();
    }
  }
});
