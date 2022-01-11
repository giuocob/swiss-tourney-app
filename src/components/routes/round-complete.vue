<template>
<div class="mt-2 mx-3">
	<div class="d-block ms-2 mb-2">
		<h2>Round {{this.roundNumber}} Results</h2>
	</div>
	<standings-display players="players"></standings-display>
	<div class="d-block mt-5 mb-3">
		<button v-if="hasNextRound" @click="clickNextRound" class="btn btn-lg btn-primary">Next round</button>
		<button v-else @click="clickFinishTournament" class="btn btn-lg btn-primary">Finish Tourney</button>
	</div>
</div>
</template>

<script>
import { checkRedirect, currentTournamentLink } from '../../logic/routes';
import { StandingsDisplay } from '..';

export default {
	name: 'route-round-complete',
	data() {
		return { roundNumber: null };
	},
	created() {
		checkRedirect(this, {
			tStateReqs: {
				lifecycle: 'in-progress',
				roundLifecycle: 'complete'
			}
		});
		this.roundNumber = this.$store.state.activeTournament.currentRoundNumber;
	},
	computed: {
		players() {
			return this.$store.state.activeTournament.players;
		},
		hasNextRound() {
			let maxRounds = this.$store.state.activeTournament.maxRounds;
			if (!maxRounds || (this.roundNumber >= maxRounds)) return false;
			return true;
		}
	},
	methods: {
		clickNextRound: async function() {
			if (!this.hasNextRound) return;
			await this.$store.dispatch('setupNextRound');
			this.$router.push(currentTournamentLink(this.$store.state.activeTournament));
		},
		clickFinishTournament: async function() {
			if (this.hasNextRound) return;
			await this.$store.dispatch('completeTournament');
			this.$router.push(currentTournamentLink(this.$store.state.activeTournament));
		}
	},
	components: { StandingsDisplay }
}
</script>
