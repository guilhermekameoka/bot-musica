import { Command } from "#base";
import { createQueueMetadata, icon, res } from "#functions";
import { brBuilder } from "@magicyan/discord";
import { QueryType, SearchQueryType, useMainPlayer } from "discord-player";
import {
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from "discord.js";

new Command({
  name: "musica",
  description: "comando de música",
  dmPermission: false,
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "tocar",
      description: "tocar música",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "busca",
          description: "nome da música ou URL",
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "engine",
          description: "engine de busca",
          type: ApplicationCommandOptionType.String,
          choices: Object.values(QueryType).map((type) => ({
            name: type,
            value: type,
          })),
        },
      ],
    },
  ],
  async run(interaction) {
    const { options, member, guild, channel, client } = interaction;

    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      interaction.reply(
        "⚠️ Você precisa estar em um canal de voz para usar este comando!"
      );
      return;
    }
    if (!channel) {
      interaction.reply(
        "⚠️ Não foi possível utilizar este comando neste canal de texto!"
      );
      return;
    }

    const metadata = createQueueMetadata({
      channel,
      client,
      guild,
      voiceChannel,
    });
    const player = useMainPlayer();
    const queue = player?.queues.cache.get(guild.id);

    await interaction.deferReply({ ephemeral: true });

    switch (options.getSubcommand(true)) {
      case "tocar": {
        const query = options.getString("busca", true);
        const searchEngine = options.getString("engine") ?? QueryType.YOUTUBE;

        try {
          const { track, searchResult } = await player?.play(
            voiceChannel as never,
            query,
            {
              searchEngine: searchEngine as SearchQueryType,
              nodeOptions: { metadata },
            }
          );

          const display: string[] = [] as string[];

          if (searchResult.playlist) {
            const { tracks, title, url } = searchResult.playlist;
            display.push(
              `🎵 Adicionadas ${tracks.length} da playlist [${title}](${url})`
            );
            display.push(
              ...tracks.map((track: any) => `${track.title}`).slice(0, 8)
            );
            display.push("...");
          } else {
            display.push(
              `${icon(":a:dj")} ${
                queue?.size ? "Adicionado à fila" : "Tocando agora"
              } ${track?.toString()}`
            );
          }
          interaction.editReply(res.success(brBuilder(display).toString()));
        } catch (_) {
          interaction.editReply(
            res.danger("⚠️ Não foi possível tocar a música!")
          );
        }
        return;
      }
    }
  },
});
