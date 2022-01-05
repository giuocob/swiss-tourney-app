import _ from 'lodash';

function vuexConfig(appContext) {
	return {
		state: {
			activeTournament: null
		},
		mutations: {
			setActiveTournament(state, payload) {
				state.activeTournament = _.cloneDeep(payload);
			}
		},
		actions: {
			setActiveTournament: async function({ commit }, payload) {
				if (payload.flushStorage) {
					await appContext.storageEngine.setActiveTournament(tState);
				}
				commit('setActiveTournament', payload.tournament);
			},
			createNewTournament: function({ commit }) {
				let tState = {
					lifecycle: 'setup-player-entry',
					players: [],
					rounds: []
				};
				commit('setActiveTournament', tState);
				appContext.storageEngine.setActiveTournament(tState);
			},
			deleteActiveTournament: function({ commit }) {
				commit('setActiveTournament', {});
				appContext.storageEngine.clearActiveTournament();
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
