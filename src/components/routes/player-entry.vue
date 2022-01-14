<template>
	<div class="mx-3 mt-4 player-entry">
		<div v-for="player in players" class="d-flex flex-row bg-primary mb-3 py-2 shadow" :key="player.id">
			<h4 class="flex-fill text-break ps-3 mb-0">{{player.name}}</h4>
			<button @click="deletePlayer(player.id, $event)" class="btn btn-danger mx-3">DELETE</button>
		</div>
		<div class="mb-5">
			<div class="d-flex flex-row bg-success py-2" key="inputLiKey">
				<input v-model="inputName" ref="entryText" type="text" class="transparent-input flex-fill">
				<button @click="addPlayer" class="input-group-btn btn btn-warning mx-3" data-bs-toggle="button">ADD</button>
			</div>
			<p v-if="invalidMessage" class="fs-6 text-danger">{{invalidMessage}}</p>
		</div>
		<button @click="submitForm" class="btn btn-lg btn-success mt-4">Submit</button>
	</div>
</template>

<script>
	import { checkRedirect } from '../../logic/routes';

	export default {
		name: 'route-player-entry',
		data() {
			return {
				inputName: '',
				invalidMessage: ''
			}
		},
		created() {
			checkRedirect(this, {
				tStateReqs: { lifecycle: [ 'setup-player-entry', 'setup-options' ] }
			});
		},
		computed: {
			players() {
				let tState = this.$store.state.activeTournament;
				if (!tState) return [];
				return Object.keys(tState.players || {})
					.sort()
					.map((playerId) => tState.players[playerId]);
			}
		},
		methods: {
			async addPlayer() {
				if (!this.inputName) return;
				try {
					await this.$store.dispatch('setupAddPlayer', { name: this.inputName.trim() });
				} catch (err) {
					if (err.name === 'NameConflictError') {
						this.invalidMessage = 'Identical names not allowed';
						return;
					}
					throw err;
				}
				this.inputName = '';
				this.$refs.entryText.focus();
			},
			deletePlayer(playerId) {
				this.$store.dispatch('setupDeletePlayer', { playerId });
			},
			async submitForm(entries) {
				if (this.players.length < 2) return;
				await this.$store.dispatch('setupConfirmPlayers');
				this.$router.push('/setup');
			}
		},
		watch: {
			inputName: function() {
				this.invalidMessage = '';
			}
		}
	};
</script>
