import _ from 'lodash';
import swiss from './swiss';

/*
	Sample structure of tState:
	{
		lifecycle: 'in-progress',
		players: [
			{ id: 2, name: 'Alice', status: 'active' },
			{ id: 3, name: 'Bob', status: 'dropped' }
		],
		nextPlayerIdNum: 4,
		maxRounds: 3,
		currentRoundNumber: 2,
		currentRound: { ... },
		roundLifecycle: 'in-progress',
		previousRounds: [ ... ]
	}
*/
const INITIAL_TSTATE = {
	lifecycle: 'setup-player-entry',
	players: {},
	rounds: [],
	nextPlayerIdNum: 1
};

function vuexConfig(appContext) {
	return {
		state: {
			activeTournament: {}
		},
		mutations: {
			setActiveTournament(state, payload) {
				state.activeTournament = _.cloneDeep(payload);
			},
			setLifecycle(state, { lifecycle }) {
				state.activeTournament.lifecycle = lifecycle;
			},
			setupAddPlayer(state, payload) {
				let tState = state.activeTournament;
				let playerId = 'p' + ('' + tState.nextPlayerIdNum).padStart(4, '0');
				tState.players[playerId] = {
					id: playerId,
					name: payload.name,
					status: 'setup'
				};
				tState.nextPlayerIdNum += 1;
			},
			setupDeletePlayer(state, { playerId }) {
				let tState = state.activeTournament;
				delete tState.players[playerId];
			},
			setOptions(state, { maxRounds }) {
				state.activeTournament.maxRounds = maxRounds;
			},
			preparePlayers(state) {
				for (let player of Object.values(state.activeTournament.players)) {
					player.status = 'active';
					player.scores = {
						wins: 0,
						losses: 0,
						draws: 0,
						points: 0,
						omwp: 0,
						gwp: 0,
						ogwp: 0,
						rank: 1
					};
				}
			},

			startNextRound(state) {
				let tState = state.activeTournament;
				if (tState.currentRoundNumber) {
					tState.currentRoundNumber += 1;
					tState.previousRounds.push(tState.currentRound);
				} else {
					tState.currentRoundNumber = 1;
				}
				tState.currentRound = {};
				tState.currentPairingId = 1;
				tState.roundLifecycle = 'setup';
			},
			setPairings(state, { pairings }) {
				for (let pairing of pairings) {
					pairing.pairingId = state.activeTournament.currentPairingId;
					state.activeTournament.currentPairingId += 1;
				}
				state.activeTournament.currentRound.pairings = pairings;
			},
			setPairingLocked(state, { pairingId, locked }) {
				let pairings = state.activeTournament.currentRound.pairings;
				if (!pairings) return;
				let pairing = pairings.find((elem) => elem.pairingId === pairingId);
				if (pairing) pairing.locked = locked;
			}
		},
		actions: {
			setActiveTournament: async function({ commit }, payload) {
				if (payload.flushStorage) {
					await appContext.storageEngine.setActiveTournament(tState);
				}
				commit('setActiveTournament', payload.tournament);
			},
			createNewTournament: async function({ commit }) {
				let tState = { ...INITIAL_TSTATE };
				commit('setActiveTournament', tState);
				appContext.storageEngine.setActiveTournament(tState);
			},
			deleteActiveTournament: async function({ commit }) {
				commit('setActiveTournament', {});
				appContext.storageEngine.clearActiveTournament();
			},

			setupAddPlayer: async function({ commit, state }, payload) {
				let nameConflict = Object.values(state.activeTournament.players).find((elem) => elem.name === payload.name);
				if (nameConflict) {
					let err = new Error('Name conflict');
					err.name = 'NameConflictError';
					throw err;
				}
				commit('setupAddPlayer', payload);
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			setupDeletePlayer: async function({ commit }, payload) {
				commit('setupDeletePlayer', payload);
			},
			setupConfirmPlayers: async function({ commit, state }) {
				commit('setLifecycle', { lifecycle: 'setup-options' });
				commit('setOptions', {
					maxRounds: swiss.getDefaultMaxRounds(Object.keys(state.activeTournament.players).length)
				});
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			setupSetOptions: async function({ commit, state }, { maxRounds }) {
				commit('setOptions', { maxRounds });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			startTournament: async function({ commit, state }) {
				commit('preparePlayers');
				commit('startNextRound');
				let pairings = swiss.getPairings(Object.values(state.activeTournament.players));
				commit('setPairings', { pairings });
				commit('setLifecycle', { lifecycle: 'in-progress' });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			}
		},
		getters: {
			hasActiveTournament: function(state) {
				if (!state.activeTournament || Object.keys(state.activeTournament).length === 0) return false;
				return true;
			},
			playersById: function(state) {
				let ret = {};
				let players = state.activeTournament && state.activeTournament.players || [];
				for (let player of players) {
					ret[player.id] = player;
				}
				return ret;
			},
			expandedPairings: function(state) {
				let pairings = state.activeTournament.currentRound && state.activeTournament.currentRound.pairings;
				let players = state.activeTournament.players;
				if (!pairings || !players) return null;
				let ep = pairings.map((pairing) => {
					let ret = {
						pairingId: pairing.pairingId,
						locked: !!pairing.locked
					};
					ret.players = pairing.playerIds.map((playerId) => {
						if (playerId === 'bye') return { id: playerId, name: 'Bye' };
						if (playerId === 'forfeit') return { id: playerId, name: 'Forfeit' };
						let player = players[playerId];
						if (!player) return null;
						return {
							id: player.id,
							name: player.name,
							standing: swiss.getPlayerStandingString(player)
						};
					});
					return ret;
				});
				return ep;
			}
		}
	};
}

export default { vuexConfig };
