<template>
<div>
	<div class="table-responsive">
		<table class="table standings-table">
			<thead>
				<tr>
					<td scope="col">Rank</td>
					<td scope="col">Name</td>
					<td scope="col">Score</td>
					<template v-if="showTiebreaks">
						<td scope="col">OMW</td>
						<td scope="col">GW</td>
						<td scope="col">OGW</td>
					</template>
				</tr>
			</thead>
			<tbody>
				<tr v-for="player in sortedPlayers">
					<td scope="row">{{player.scores.rank}}</td>
					<td scope="row">{{player.name.slice(0, 15)}}</td>
					<td scope="row">{{getPlayerStandingString(player)}}</td>
					<template v-if="showTiebreaks">
						<td scope="row">{{formatPercent(player.scores.omwp)}}</td>
						<td scope="row">{{formatPercent(player.scores.gwp)}}</td>
						<td scope="row">{{formatPercent(player.scores.ogwp)}}</td>
					</template>
				</tr>
			</tbody>
		</table>
	</div>
	<div class="d-block float-end mt-1">
		<button @click="toggleTiebreaks" class="btn btn-sm btn-warning">
			{{this.showTiebreaks ? 'Hide Tiebreaks' : 'Show Tiebreaks'}}
		</button>
	</div>
</div>
</template>

<script>
import swiss from '../logic/swiss';

export default {
	name: 'standings-display',
	data() {
		return { showTiebreaks: false };
	},
	computed: {
		sortedPlayers() {
			return Object.values(this.$store.state.activeTournament.players).sort((a, b) => {
				if (a.scores.rank < b.scores.rank) return -1;
				if (a.scores.rank > b.scores.rank) return 1;
				if (a.id < b.id) return -1;
				if (a.id > b.id) return 1;
				return 0;
			})
				.filter((player) => (player.status === 'active'));
		}
	},
	methods: {
		getPlayerStandingString: swiss.getPlayerStandingString,
		formatPercent(num) {
			if (typeof num !== 'number') return 0;
			return num.toFixed(3);
		},
		toggleTiebreaks() {
			this.showTiebreaks = !this.showTiebreaks;
		}
	}
};
</script>
