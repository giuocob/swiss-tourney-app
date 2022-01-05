// Base class for localstorage and api-based storage engines; can be instantiated directly as an engine
// that doesn't store anything

class StorageEngine {

	constructor() {
		// Nothing
	}

	async getStoredActiveTournament() {
		// Pretend there is never any stored tournament by default
		return null;
	}

	async setActiveTournament(tState) {
		// Nothing
	}

	async clearActiveTournament() {
		// Nothing
	}
}

export default StorageEngine;
