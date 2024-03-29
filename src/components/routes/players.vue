<template>
<div ref="latecomerModalDiv" class="modal" tabindex="-1">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-body">
				<div class="fs-4 mb-2">Add Latecomer</div>
				<div class="input-group mb-2">
					<span class="input-group-text">Player Name</span>
					<input v-model="latecomerName" type="text" class="form-control latecomer-input">
				</div>
				<p v-if="invalidMessage" class="fs-6 text-danger">{{invalidMessage}}</p>
			</div>
			<div class="modal-footer">
				<button @click="closeLatecomerModal" type="button" class="btn btn-secondary">Cancel</button>
				<button @click="submitLatecomerModal" type="button" class ="btn btn-primary">OK</button>
			</div>
		</div>
	</div>
</div>

<div class="mx-3 mt-4 player-entry">
	<div v-for="player in playerArray" class="d-flex flex-row bg-primary mb-3 py-2 shadow"
		:class="getPlayerBGClasses(player)"
	>
		<h4 class="flex-fill text-break ps-3 mb-0" :class="getPlayerClasses(player)">
			{{player.name}}
		</h4>
		<button v-if="playerIsActive(player) && (lifecycle === 'in-progress')"
			@click="clickDropPlayer(player.id, $event)" class="btn btn-danger mx-3"
		>
			DROP
		</button>
		<h6 v-else-if="player.status === 'dropped'" class="pe-2 mb-0 pname-dropped">DROPPED</h6>
		<h6 v-else-if="player.status === 'eliminated'" class="pe-2 mb-0 pname-dropped">ELIMINATED</h6>
	</div>
	<button v-if="lifecycle === 'in-progress'" @click="clickAddLatecomer" class="btn btn-warning mt-4">
		Add Latecomer
	</button>
</div>
</template>

<script>
import { checkRedirect } from '../../logic/routes';

export default {
	name: 'route-players',
	data() {
		return {
			latecomerName: '',
			invalidMessage: null,
			dropPlayerId: null
		};
	},
	created() {
		checkRedirect(this, {
			tStateReqs: {
				lifecycle: [ 'in-progress', 'complete' ]
			}
		});
	},
	computed: {
		playerArray() {
			let statusSortMap = {
				active: 4,
				eliminated: 3,
				dropped: 2,
				setup: 1
			};
			let tState = this.$store.state.activeTournament;
			if (!tState) return [];
			return Object.keys(tState.players || {})
				.sort((a, b) => {
					let statusA = tState.players[a].status;
					let statusAVal = statusSortMap[statusA] || 0;
					let statusB = tState.players[b].status;
					let statusBVal = statusSortMap[statusB] || 0;
					if (statusAVal > statusBVal) return -1;
					if (statusAVal < statusBVal) return 1;
					if (a < b) return -1;
					if (a > b) return 1;
					return 0;
				})
				.map((playerId) => tState.players[playerId]);
		},
		isComplete() {
			let tState = this.$store.state.activeTournament || {};
			return (tState.lifecycle === 'complete');
		},
		lifecycle() {
			return this.$store.state.activeTournament && this.$store.state.activeTournament.lifecycle;
		}
	},
	methods: {
		getPlayerClasses(player) {
			if (player.status === 'active' || player.status === 'setup') return [ 'bg-primary' ];
			if (player.status === 'dropped' || player.status === 'eliminated') return [ 'pname-dropped' ];
			return [];
		},
		getPlayerBGClasses(player) {
			if (player.status === 'active' || player.status === 'setup') return [ 'bg-primary' ];
			if (player.status === 'eliminated') return [ 'bg-warning' ];
			if (player.status === 'dropped') return [ 'bg-danger' ];
			return [];
		},
		playerIsActive(player) {
			if (player.status === 'active' || player.status === 'setup') return true;
			return false;
		},
		clickAddLatecomer: function() {
			this.modalWrapper.show();
		},
		closeLatecomerModal: function() {
			this.latecomerName = '';
			this.invalidMessage = null;
			this.modalWrapper.hide();
		},
		async submitLatecomerModal() {
			if (!this.latecomerName) return;
			try {
				await this.$store.dispatch('activeAddPlayer', { name: this.latecomerName.trim() });
			} catch (err) {
				if (err.name === 'NameConflictError') {
					this.invalidMessage = 'Identical names not allowed';
					return;
				}
				throw err;
			}
			this.closeLatecomerModal();
		},
		async clickDropPlayer(playerId) {
			let tState = this.$store.state.activeTournament;
			let player = tState.players[playerId];
			if (!player) return;
			this.$store.dispatch('showGlobalModal', {
				mode: 'areYouSure',
				message: `Drop ${player.name} from the event?`,
				submitAction: [ {
						type: 'dispatchAction',
						action: 'dropPlayer',
						payload: { playerId }
				} ]
			});
		}
	},
	mounted() {
		this.modalWrapper = this.$bootstrap.addModal(this, this.$refs.latecomerModalDiv)
	},
}
</script>
