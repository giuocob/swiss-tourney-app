// Base class for localstorage and api-based storage engines; can be instantiated directly as an engine
// that doesn't store anything

class LocalStorageEngine {

	constructor() {
		if (!window.localStorage) {
			throw new Error('No localStorage found');
		}
	}

	async getStoredActiveTournament() {
		let tState = window.localStorage.getItem('activeTournament');
		if (tState) {
			let tStateObj = JSON.parse(tState);
			if (tStateObj && Object.keys(tStateObj).length > 0) return tStateObj;
		}
		return null;
	}

	async setActiveTournament(tState) {
		window.localStorage.setItem('activeTournament', JSON.stringify(tState));
	}

	async clearActiveTournament() {
		window.localStorage.removeItem('activeTournament');
	}

}

export default LocalStorageEngine;
