<template>
<div>
	<button v-if="hasActiveTournament" @click="gotoCurrentTournamentLink"
		class="btn btn-lg btn-success d-block mx-auto my-5">
		Active Tourney
	</button>
	<button @click="startNewTournament" class="btn btn-lg btn-primary d-block mx-auto my-5">Start New Tourney</button>
	<button @click="deleteTournament" class="btn btn-lg btn-danger d-block mx-auto my-5" >Delete Active Tourney</button>
	<button v-if="hasActiveTournament" @click="clickExportTournamentData"
		class="btn btn-warning d-block mx-auto my-5">
		Export Current Pairings
	</button>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { currentTournamentLink } from '../../logic/routes';

export default {
	name: 'route-main',
	computed: {
		...mapGetters([ 'hasActiveTournament' ])
	},
	methods: {
		startNewTournament() {
			if (this.hasActiveTournament) {
				this.$store.dispatch('showGlobalModal', {
					mode: 'areYouSure',
					message: 'There is already an active tourney; creating a new one will cancel it. ' +
						'Are you sure you want to continue?',
					submitAction: [
						{
							type: 'dispatchAction',
							action: 'createNewTournament'
						},
						{
							type: 'redirect',
							link: '/player-entry'
						}
					]
				});
			} else {
				this.$store.dispatch('createNewTournament');
				this.$router.push('/player-entry');
			}
		},
		async deleteTournament() {
			if (this.hasActiveTournament) {
				await this.$store.dispatch('deleteActiveTournament');
				this.$store.dispatch('showGlobalModal', {
					mode: 'info',
					message: 'Active tourney removed.'
				});
			} else {
				this.$store.dispatch('showGlobalModal', {
					mode: 'info',
					message: 'No active tourney to remove.'
				});
			}
		},
		gotoCurrentTournamentLink() {
			let tState = this.$store.state.activeTournament;
			this.$router.push(currentTournamentLink(tState));
		},
		async clickExportTournamentData() {
			await this.$store.dispatch('downloadAllRoundsCsv');
		}
	}
};
</script>
