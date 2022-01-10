const HOME_PAGE = '/';

function checkRedirect(vm, conditionObj) {
	if (!conditionObj) return;

	let shouldRedirect = false;
	let tState = vm.$store.state.activeTournament || {};

	for (let conditionKey in conditionObj.tStateReqs || {}) {
		let conditionValue = conditionObj.tStateReqs[conditionKey];
		let cvArr = Array.isArray(conditionValue) ? conditionValue : [ conditionValue ];
		if (!cvArr.find((elem) => (elem === tState[conditionKey]))) shouldRedirect = true;
	}
	if (conditionObj.customFn) {
		if (conditionObj.customFn(tState) === true) shouldRedirect = true;
	}

	if (shouldRedirect) {
		vm.$router.replace(HOME_PAGE);
	}
	return shouldRedirect;
}

function currentTournamentLink(tState) {
	if (!tState) return '/';
	if (tState.lifecycle === 'setup-player-entry') return '/player-entry';
	if (tState.lifecycle === 'setup-options') return '/setup';
	if (tState.lifecycle === 'in-progress') {
		if (tState.roundLifecycle === 'setup') return `/round-setup/${tState.currentRoundNumber}`;
		if (tState.roundLifecycle === 'in-progress') return `/round/${tState.currentRoundNumber}`;
	}
	return '/not-found';
}

export { checkRedirect, currentTournamentLink };
