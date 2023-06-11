const { ApplicationCommandOptionType } = require("discord.js");
const Keyv = require("keyv");
const messages = require("../objects/messages");

const serverInfo = new Keyv("sqlite://db.sqlite", { table: "server" });

module.exports = {
  data: {
    name: "setting",
    description: "らいむの設定を行います。",
    options: [
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "operator",
        description: "ゲームのオペレーターロールを設定します。",
        options: [
          {
            type: ApplicationCommandOptionType.Role,
            name: "operator_role",
            description: "ゲームのオペレーターのロールを入力してください。",
            required: true,
          },
        ],
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "init",
        description:
          "らいむが記録しているこのサーバーに関する情報を初期化します。",
      },
    ],
  },
  async execute(interaction) {
    if (interaction.commandName === "setting") {
      if (!interaction.member.permissions.has("ADMINISTRATOR")) return;
      const subCommandName = await interaction.options.getSubcommand();
      if (subCommandName === "operator") {
        const guildId = await interaction.guild.id;
        const targetRole = await interaction.options.getRole("operator_role");
        if (!(await serverInfo.get(guildId))) {
          await serverInfo.set(guildId, {
            home: interaction.guild.systemChannel,
            operator: "",
          });
        }
        let previousServerInfo = await serverInfo.get(guildId);
        previousServerInfo.operator = await targetRole.id;
        await serverInfo.set(guildId, previousServerInfo);
        await interaction.editReply(
          messages.success(
            `<@&${targetRole.id}>をゲームオペレーターに設定しました。`
          )
        );
      } else if (subCommandName === "init") {
        if (!interaction.member.permissions.has("ADMINISTRATOR")) return;
        await serverInfo.set(await interaction.guild.id, {
          home: interaction.guild.systemChannel,
          operator: "",
        });
        await interaction.editReply(
          messages.success(`情報の初期化に成功しました。`)
        );
      }
    }
  },
};
