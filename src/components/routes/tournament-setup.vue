<template>
	<div class="w-md-50 mx-3 mt-4">
		<h1>SETUP</h1>
	</div>
</template>

<script>
import { checkRedirect } from '../../logic/routes';

export default {
	name: 'route-tournament-setup',
	created() {
		checkRedirect(this, { tStateLifecycle: 'setup-options' });
	}
};
</script>
