function vuexConfig(appContext) {
	return {
		state: {
			globalModal: { shown: false }
		},
		mutations: {
			showGlobalModal(state, payload) {
				state.globalModal = { ...payload, shown: true };
			},
			hideGlobalModal(state) {
				state.globalModal = { shown: false };
			}
		},
		actions: {
			showGlobalModal({ commit }, payload) {
				commit('showGlobalModal', payload);
			},
			hideGlobalModal({ commit }, payload) {
				commit('hideGlobalModal', payload);
			}
		}
	};
}

export default { vuexConfig };
