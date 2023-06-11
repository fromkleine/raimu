const { ApplicationCommandOptionType } = require("discord.js");
const Battle = require("../classes/battle_class");
const messages = require("../objects/messages");
const Raimu = require("../classes/raimu_class");

module.exports = {
  data: {
    name: "battle",
    description: "新しいバトルを開始します。",
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: "mc1",
        description: "先攻のユーザーをセットします。",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.User,
        name: "mc2",
        description: "後攻のユーザーをセットします。",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "title",
        description: "バトルのタイトルを設定します。",
      },
    ],
  },
  async execute(interaction) {
    if (interaction.commandName === "battle") {
      //ゲームを開始します。
      const mc1User = await interaction.options.getUser("mc1");
      const mc2User = await interaction.options.getUser("mc2");
      const guild = await interaction.guild;
      //運営権限を持っているか
      if (!(await Raimu.operatorCheck(guild, interaction.member))) {
        await interaction.editReply(messages.fail("権限がありません。"));
        return;
      }
      const mc1 = await guild.members.cache.get(mc1User.id);
      const mc2 = await guild.members.cache.get(mc2User.id);
      let title = await interaction.options.getString("title");
      const channelId = await interaction.channelId;
      const guildId = await guild.id;
      const battle = new Battle(interaction.channel, mc1, mc2, title);
      if (!battles[guildId] && battles[guildId] !== {}) battles[guildId] = {};
      if (!battles[guildId][channelId] && battles[guildId][channelId] !== []) {
        battles[guildId][channelId] = [];
      }
      battles[guildId][channelId].push(battle);
      if (battles[guildId][channelId].length === 1) {
        battle.create();
        await interaction.editReply(
          messages.success("バトルを作成しましました。")
        );
      } else {
        if (battles[guildId][channelId].length >= 20) {
          await interaction.editReply(
            messages.fail("キューのバトル数が限界です。(20/20)")
          );
        }
        await interaction.editReply(
          messages.success(
            `バトルをキューに追加しました。(${battles[guildId][channelId].length}/20)`
          )
        );
      }
    }
  },
};
