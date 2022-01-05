const HOME_PAGE = '/';

function checkRedirect(vm, conditionObj) {
	if (!conditionObj) return;

	let shouldRedirect = false;
	let tState = vm.$store.state.activeTournament || {};
	if (conditionObj.tStateLifecycle) {
		if (tState.lifecycle !== conditionObj.tStateLifecycle) shouldRedirect = true;
	}
	if (conditionObj.customFn) {
		if (conditionObj.customFn(tState) === true) shouldRedirect = true;
	}

	if (shouldRedirect) {
		vm.$router.push(HOME_PAGE);
	}
}

export { checkRedirect };
