<template>
<nav class="navbar navbar-expand-md navbar-light bg-primary">
  <div class="container-fluid">
    <p class="navbar-brand my-0">Swiss Tourneys</p>
    <button ref="navToggle" class="navbar-toggler" type="button">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div ref="navTarget" class="collapse navbar-collapse">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item">
					<router-link to="/" class="nav-link">Home</router-link>
        </li>
        <li v-if="hasActiveTournament" class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown">
            Active Tourney
          </a>
          <ul class="dropdown-menu">
						<li>
							<router-link :to="currentTournamentLink" class="dropdown-item">Current Page</router-link>
						</li>
						<li>
							<router-link to="/standings" class="dropdown-item">Standings</router-link>
						</li>
						<li><hr class="dropdown-divider"></li>
						<li v-for="round in navState.rounds">
							<router-link :to="round.page" class="dropdown-item">{{round.name}}</router-link>
						</li>
          </ul>
        </li>
        <li v-else class="nav-item">
          <a class="nav-link disabled" tabindex="-1">Active Tourney</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
</template>

<script>
import { mapGetters } from 'vuex';
import { currentTournamentLink } from '../logic/routes';

export default {
	name: 'GlobalSidebar',
	computed: {
    ...mapGetters([ 'hasActiveTournament' ]),
		navState() {
			return {
				activeTournament: true,
				standingsPage: '/standings',
				rounds: [
					{ name: 'Round 1', page: '/' },
					{ name: 'Round 2', page: '/' }
				]
			};
		},
    currentTournamentLink() {
      let tState = this.$store.state.activeTournament;
      return currentTournamentLink(tState);
    }
	},
	mounted() {
		this.$bootstrap.addCollapse(this, this.$refs.navTarget, this.$refs.navToggle);
	}
};
</script>
