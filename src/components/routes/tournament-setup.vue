<template>
	<div class="mx-3 mt-4">
		<button @click="this.$router.push('/player-entry')" class="d-block btn btn-warning mb-3">
			Back to players
		</button>
		<div class="d-block btn-group btn-group-lg mt-4">
			<template v-for="roundTypeObj in roundTypes" key="roundTypeObj.id">
				<input v-model="roundType" type="radio" class="btn-check" autocomplete="off"
					:id="roundTypeObj.id" :value="roundTypeObj.id"
				>
				<label class="btn btn-outline-primary" :for="roundTypeObj.id">{{roundTypeObj.label}}</label>
			</template>
		</div>
		<div class="input-group input-group-lg mt-4">
			<span class="input-group-text">Number of rounds</span>
			<input v-model="maxRounds" type="number" class="form-control numeric-small">
		</div>
		<div class="input-group input-group-lg mt-4">
			<span class="input-group-text">Match point elim threshold</span>
			<input v-model="matchPointElimThreshold" type="number" class="form-control numeric-small">
		</div>
		<div class="d-block mt-5">
			<button @click="submitForm" class="btn btn-lg btn-success">Start tourney</button>
		</div>
	</div>
</template>

<script>
import { checkRedirect } from '../../logic/routes';

const ROUND_TYPES = [
	{ id: 'normal', label: 'Normal', playersPerRound: 2, byeGamesAwarded: 2 },
	{ id: 'commander', label: 'Commander', playersPerRound: 4, byeGamesAwarded: 1 }
];

export default {
	name: 'route-tournament-setup',
	data() {
		return {
			maxRounds: 0,
			matchPointElimThreshold: 0,
			roundType: null
		};
	},
	created() {
		checkRedirect(this, {
			tStateReqs: { lifecycle: 'setup-options' }
		});
		this.maxRounds = this.$store.state.activeTournament.maxRounds;
		let playersPerRound = this.$store.state.activeTournament.playersPerRound;
		let roundTypeObj = ROUND_TYPES.find((obj) => (obj.playersPerRound === playersPerRound));
		if (roundTypeObj) this.roundType = roundTypeObj.id;
	},
	computed: {
		roundTypes() {
			return ROUND_TYPES;
		}
	},
	methods: {
		async submitForm() {
			let maxRounds = parseInt(this.maxRounds);
			let matchPointElimThreshold = parseInt(this.matchPointElimThreshold);
			if (isNaN(maxRounds) || maxRounds < 1) return;
			let roundTypeObj = ROUND_TYPES.find((obj) => (obj.id === this.roundType));
			if (!roundTypeObj) return;
			await this.$store.dispatch('setupSetOptions', {
				maxRounds,
				playersPerRound: roundTypeObj.playersPerRound,
				byeGamesAwarded: roundTypeObj.byeGamesAwarded,
				matchPointElimThreshold
			});
			await this.$store.dispatch('startTournament');
			this.$router.push('/round-setup/1');
		}
	}
};
</script>
