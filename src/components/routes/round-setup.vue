<template>
	<div class="mt-2 mx-3">
		<div class="d-block ms-2 mb-2">
			<h2>Round {{this.roundNumber}} Pairings</h2>
		</div>
		<div class="container m-0">
			<div class="row row-cols-1 row-cols-md-2">
				<div v-for="pairing in expandedPairings" key="pairing.pairingId" class="col my-2">
					<pairing-display mode="view" :pairing="pairing">
					</pairing-display>
				</div>
			</div>
		</div>
		<div class="d-block ms-2">
			<button @click="clickEdit" class="btn btn-warning d-block mt-3">Edit pairings</button>
			<button @click="clickSubmit" :disabled="!canStartRound" class="btn btn-lg btn-success d-block mt-4">
				Start round
			</button>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { PairingDisplay } from '..';
import { checkRedirect } from '../../logic/routes';

export default {
	name: 'route-round-setup',
	data() {
		return {
			roundNumber: null
		};
	},
	created() {
		this.roundNumber = parseInt(this.$route.params.roundNumber);
		if (isNaN(this.roundNumber)) return this.$router.push('/')
		checkRedirect(this, {
			tStateReqs: {
				lifecycle: 'in-progress',
				roundLifecycle: 'setup',
				currentRoundNumber: this.roundNumber
			}
		});
	},
	computed: {
		...mapGetters([ 'expandedPairings' ]),
		canStartRound() {
			return !!this.$store.state.activeTournament.currentRound.pairingsValid;
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
