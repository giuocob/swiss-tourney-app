<template>
	<div class="mx-3 mt-4">
		<button @click="this.$router.push('/player-entry')" class="btn btn-warning mb-3">
			Back to players
		</button>
		<div class="input-group input-group-lg mb-3">
			<span class="input-group-text">Number of rounds</span>
			<input v-model="maxRounds" type="number" class="form-control numeric-small">
		</div>
		<button @click="submitForm" class="btn btn-lg btn-success mt-4">Start tourney</button>
	</div>
</template>

<script>
import { checkRedirect } from '../../logic/routes';

export default {
	name: 'route-tournament-setup',
	data() {
		return {
			maxRounds: 0
		};
	},
	created() {
		checkRedirect(this, {
			tStateReqs: { lifecycle: 'setup-options' }
		});
		this.maxRounds = this.$store.state.activeTournament.maxRounds;
	},
	methods: {
		async submitForm() {
			let maxRounds = parseInt(this.maxRounds);
			if (isNaN(maxRounds) || maxRounds < 1) return;
			await this.$store.dispatch('setupSetOptions', { maxRounds });
			await this.$store.dispatch('startTournament');
			this.$router.push('/round-setup/1');
		}
	}
};
</script>
