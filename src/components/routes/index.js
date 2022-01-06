import RouteMain from './main.vue';
import PageNotFound from './page-not-found.vue';
import RoutePlayerEntry from './player-entry.vue';
import RouteRoundSetup from './round-setup.vue';
import RouteTournamentSetup from './tournament-setup.vue';

export default [
	{ path: '/', component: RouteMain },
	{ path: '/player-entry', component: RoutePlayerEntry },
	{ path: '/setup', component: RouteTournamentSetup },
	{ path: '/round-setup/:roundNumber', component: RouteRoundSetup },
	{ path: '/:catchAll(.*)', component: PageNotFound }
];
