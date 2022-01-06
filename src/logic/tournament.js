import _ from 'lodash';

/*
	Sample structure of tState:
	{
		lifecycle: 'in-progress',
		players: [
			{ id: 2, name: 'Alice', status: 'active' },
			{ id: 3, name: 'Bob', status: 'dropped' }
		],
		nextPlayerId: 4,
		maxRounds: 3,
		currentRound: 2,
		roundLifecycle: 'in-progress',
		roundHistory: [ ... ]
	}
*/
const INITIAL_TSTATE = {
	lifecycle: 'setup-player-entry',
	players: [],
	nextPlayerId: 1
};

function vuexConfig(appContext) {
	return {
		state: {
			activeTournament: null
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
				tState.players.push({
					id: tState.nextPlayerId,
					name: payload.name,
					status: 'active'
				});
				tState.nextPlayerId += 1;
			},
			setupDeletePlayer(state, payload) {
				let tState = state.activeTournament;
				let deleteIndex = tState.players.findIndex((elem) => elem.id === payload.playerId);
				tState.players.splice(deleteIndex, 1);
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
				let nameConflict = state.activeTournament.players.find((elem) => elem.name === payload.name);
				if (nameConflict) {
					let err = new Error('Name conflict');
					err.name = 'NameConflictError';
					throw err;
				}
				commit('setupAddPlayer', payload);
			},
			setupDeletePlayer: async function({ commit }, payload) {
				commit('setupDeletePlayer', payload);
			},
			setupConfirmPlayers: async function({ commit, state }) {
				commit('setLifecycle', { lifecycle: 'setup-options' });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			}
		},
		getters: {
			hasActiveTournament: function(state) {
				if (!state.activeTournament || Object.keys(state.activeTournament).length === 0) return false;
				return true;
			}
		}
	};
}

export default { vuexConfig };
