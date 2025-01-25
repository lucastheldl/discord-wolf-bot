const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;
const gameManager = require("../../game-state");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("visitar")
		.setDescription(
			`Se você for a cortesã, escolha um usuario "visitar" durante a noite e descobrir seu papel`,
		)
		.addUserOption((option) =>
			option
				.setName("jogador")
				.setDescription("O jogador que você quer visitar")
				.setRequired(true),
		),
	async execute(interaction) {
		const game = gameManager.getGame(interaction.channelId);

		const userRole = game.playerRoles.get(interaction.user.id);
		const target = interaction.options.getUser("jogador");

		if (target.id !== interaction.user.id) {
			return await interaction.reply({
				content: "Você não pode usar esse em você mesmo!",
				flags: MessageFlags.Ephemeral,
			});
		}
		if (userRole.name !== "Cortesã") {
			return await interaction.reply({
				content: "Você não pode usar esse comando!",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (!game || game.status !== "night") {
			return await interaction.reply({
				content: "Não é possível usar este commando agora!",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (!game.players.has(interaction.user.id)) {
			return await interaction.reply({
				content: "Você não está participando deste jogo!",
				flags: MessageFlags.Ephemeral,
			});
		}

		const canUseSkill =
			game.cantUseSkill.get(interaction.user.id) === undefined ||
			!game.cantUseSkill.get(interaction.user.id);

		if (!canUseSkill) {
			return await interaction.reply({
				content: "Você não pode usar este comando agora!",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (!game.players.has(target.id)) {
			return await interaction.reply({
				content: "Este jogador não está participando do jogo!",
				flags: MessageFlags.Ephemeral,
			});
		}

		// Store the cortesain visit vote
		if (!game.nightSkills) {
			game.nightSkills = new Map();
		}
		game.nightSkills.set(interaction.user.id, target.id);

		await interaction.reply({
			content: `Seu voto para vistar ${target.username} foi registrado!`,
			flags: MessageFlags.Ephemeral,
		});
	},
};
