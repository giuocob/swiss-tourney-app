<template>
	<div class="mt-2 mx-3">
		<div class="container m-0">
			<div class="row row-cols-1 row-cols-md-2">
				<div v-for="pairing in expandedPairings" key="pairing.pairingId" class="col my-2">
					<pairing-display mode="edit" :pairing="pairing"
					@click-lock="lockPairing(pairing.pairingId)"
					@click-unlock="unlockPairing(pairing.pairingId)">
					</pairing-display>
				</div>
			</div>
		</div>
		<div class="d-block ms-2">
			<button @click="clickPair" class="btn btn-lg btn-info d-block mt-3">Re-pair</button>
			<button @click="clickSubmit" class="btn btn-lg btn-success d-block mt-4">Confirm pairings</button>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { PairingDisplay } from '..';
import { checkRedirect } from '../../logic/routes';

export default {
	name: 'route-round-edit',
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
		...mapGetters([ 'expandedPairings' ])
	},
	methods: {
		clickSubmit: function() {
			this.$router.push(`/round-setup/${this.roundNumber}`);
		},
		lockPairing: function(pairingId) {
			this.$store.commit('setPairingLocked', { pairingId: pairingId, locked: true });
		},
		unlockPairing: function(pairingId) {
			this.$store.commit('setPairingLocked', { pairingId: pairingId, locked: false });
		}
	},
	components: {
		PairingDisplay
	}
};
</script>
