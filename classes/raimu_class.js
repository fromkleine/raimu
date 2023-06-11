const Keyv = require("keyv");

const server = new Keyv("sqlite://db.sqlite", { table: "server" });

class Raimu {
  static async operatorCheck(guild, member) {
    const guildId = guild.id;
    const serverInfo = await server.get(guildId);
    if (await member.roles.cache.has(serverInfo.operator)) {
      return true;
    } else {
      return false;
    }
  }
}
module.exports = Raimu;
