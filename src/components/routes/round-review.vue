<template>
	<div class="mt-2 mx-3">
		<div class="d-block ms-2 mb-2">
			<h2>Round {{this.roundNumber}} Review</h2>
		</div>
		<div class="container m-0">
			<div class="row row-cols-1 row-cols-md-2">
				<div v-for="pairing in expandedPairings" key="pairing.pairingId" class="col my-2">
					<pairing-display mode="review" :pairing="pairing">
					</pairing-display>
				</div>
			</div>
		</div>
		<div class="d-block ms-2">
			<button @click="clickEdit" class="btn btn-warning btn-sm d-block mt-3 invisible">Edit results</button>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { PairingDisplay } from '..';
import { checkRedirect } from '../../logic/routes';

export default {
	name: 'route-round-review',
	created() {
		if (isNaN(this.roundNumber)) return this.$router.push('/');
		checkRedirect(this, {
			tStateReqs: {
				lifecycle: [ 'in-progress', 'complete' ]
			},
			customFn: () => {
				let rounds = this.$store.state.activeTournament.rounds || [];
				if (this.roundNumber > rounds.length) return true;
				return false;
			}
		});
	},
	computed: {
		roundNumber() {
			return parseInt(this.$route.params.roundNumber);
		},
		expandedPairings() {
			let ep = this.$store.getters.expandedPairingsByRound(this.roundNumber);
			return ep;
		}
	},
	methods: {
		clickEdit: function() {
			this.$router.push(`/round-edit/${this.roundNumber}`);
		},
		clickSubmit: async function() {
			await this.$store.dispatch('startRound');
			this.$router.push(`/round/${this.roundNumber}`);
		}
	},
	components: {
		PairingDisplay
	}
};
</script>
