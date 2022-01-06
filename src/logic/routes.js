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
		vm.$router.push(HOME_PAGE);
	}
	return shouldRedirect;
}

export { checkRedirect };
