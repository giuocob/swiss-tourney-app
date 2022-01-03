export default {
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
	}
};
