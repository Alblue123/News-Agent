import dotenv from 'dotenv';
dotenv.config(); 

import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, NewsChannel } from 'discord.js';
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { reporterAgent } from './agents/reporter-agent';
import { newsWorkflow } from './workflows/news-workflow';
import { writerAgent } from './agents/writer-agent';
import { newsAgent } from './agents/news-agent';

export const mastra = new Mastra({
  agents: { reporterAgent, writerAgent, newsAgent },
  workflows: { newsWorkflow },
  storage: new LibSQLStore({ url: 'file:../../mastra.db' }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
  observability: {
    default: {
      enabled: true,
    },
  },
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', async () => {
    console.log('🤖 Discord bot is ready!');
    
    // Register slash commands
    const commands = [
        new SlashCommandBuilder()
            .setName('technews')
            .setDescription('Get latest technology news')
            .addStringOption(option =>
                option.setName('topic')
                    .setDescription('Technology topic to search for')
                    .setRequired(false)
            )
    ];

    // Register commands with Discord
    if (client.application) {
        await client.application.commands.set(commands);
        console.log('✅ Slash commands registered');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'technews') {
            await handleTechNewsCommand(interaction);
        }
    } catch (error) {
        console.error('❌ Discord command error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Error')
            .setDescription('Sorry, something went wrong while fetching the news.')
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

function findArticlesString(obj: any): string | null {
  const visited = new Set<any>();
  const stack = [obj];

  while (stack.length) {
    const cur = stack.pop();
    if (!cur || visited.has(cur)) continue;
    visited.add(cur);

    if (typeof cur === 'string') {
      const s = cur.trim();
      if (s.length > 50 || s.startsWith('**Báo cáo') || s.includes('Nguồn tham khảo')) {
        return s;
      }
    } else if (typeof cur === 'object') {
      for (const key of Object.keys(cur)) {
        // prefer keys that look relevant
        if (key.toLowerCase().includes('article') && typeof cur[key] === 'string' && cur[key].trim()) {
          return cur[key];
        }
      }
      // push nested values to search
      for (const key of Object.keys(cur)) {
        stack.push(cur[key]);
      }
    }
  }
  return null;
}

async function handleTechNewsCommand(interaction: any) {
    await interaction.deferReply();

    const topic = interaction.options.getString('topic') || 'technology';

    console.log(`🔍 Discord user requested tech news: topic="${topic}"`);

    // Execute the workflow
    const result = await reporterAgent.generateVNext([
        {
            role: 'user',
            content: topic,
        },
    ]);

    console.log('Full result object:', JSON.stringify(result, null, 2));

    // Get the formatted Vietnamese summary
    const extractedArticles = findArticlesString(result) || result.text || 'Không tìm thấy nội dung bài báo.';

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`📰 Tech News: ${topic}`)
        .setDescription(extractedArticles.slice(0, 4096)) 
        .setTimestamp();

    await interaction.editReply({
        content: `📰 **Latest Tech News** - Technology news about "${topic}"`,
        embeds: [embed]
    });
}

// Start the bot
client.login(process.env.DISCORD_TOKEN);