const HOME_PAGE = '/';

function checkRedirect(vm, conditionObj) {
	if (!conditionObj) return;

	let shouldRedirect = false;
	let tState = vm.$store.state.activeTournament || {};
	if (conditionObj.tStateLifecycle) {
		let lcs = conditionObj.tStateLifecycle;
		let lcArr = Array.isArray(lcs) ? lcs : [ lcs ];
		if (!lcArr.find((elem) => (elem === tState.lifecycle))) shouldRedirect = true;
	}
	if (conditionObj.customFn) {
		if (conditionObj.customFn(tState) === true) shouldRedirect = true;
	}

	if (shouldRedirect) {
		vm.$router.push(HOME_PAGE);
	}
	return shouldRedirect;
}

export { checkRedirect };
