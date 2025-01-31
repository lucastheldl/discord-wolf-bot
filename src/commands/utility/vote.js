const gameManager = require("../../game-state");
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { handlePlayersAutocomplete } = require("../../game-handlers");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("votar")
		.setDescription("Vota em um jogador para ser eliminado")
		.addStringOption((option) =>
			option
				.setName("jogador")
				.setDescription("O jogador que você quer votar")
				.setRequired(true)
				.setAutocomplete(true),
		),
	async autocomplete(interaction) {
		const game = await gameManager.getGame(interaction.channelId);

		if (!game) {
			return;
		}

		try {
			const focusedValue = interaction.options.getFocused().toLowerCase();
			const choices = [];

			if (!game) {
				await interaction.respond([]);
				return;
			}

			await handlePlayersAutocomplete(game, interaction, focusedValue, choices);

			await interaction.respond(choices.slice(0, 25));
		} catch (error) {
			console.error("Error in autocomplete handler:", error);
			await interaction.respond([]);
		}
	},

	async execute(interaction) {
		const game = gameManager.getGame(interaction.channelId);
		if (!game || game.status !== "voting") {
			return await interaction.reply({
				content: "Não há uma votação em andamento no momento!",
				flags: MessageFlags.Ephemeral,
			});
		}
		let target = null;
		if (interaction.options.getString("jogador").includes("bot_")) {
			target = interaction.options.getString("jogador");
		} else {
			target = interaction.options.getUser("jogador");

			if (target.id !== interaction.user.id) {
				return await interaction.reply({
					content: "Você não pode usar esse em você mesmo!",
					flags: MessageFlags.Ephemeral,
				});
			}

			if (!game.players.has(target.id)) {
				return await interaction.reply({
					content: "Este jogador não está participando do jogo!",
					flags: MessageFlags.Ephemeral,
				});
			}
		}
		if (!game.players.has(interaction.user.id)) {
			return await interaction.reply({
				content: "Você não está participando deste jogo!",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (!game.votes) game.votes = new Map();
		if (game.playerRoles.get(interaction.user.id) === "Prefeito") {
			game.votes.set(
				`${interaction.user.id}-1`,
				isTargetABot ? target : target.id,
			);
		}
		game.votes.set(interaction.user.id, isTargetABot ? target : target.id);

		const { botId = null, username = null } = isTargetABot
			? game.botUsers.get(target)
			: {};

		await interaction.reply({
			content: `Seu voto em ${isTargetABot ? username : target.username} foi registrado!`,
			flags: MessageFlags.Ephemeral,
		});
	},
};
