export default {
	mutations: {
		setParticipants(state, payload) {
			state.participants = _.cloneDeep(payload);
		}
	}
};
