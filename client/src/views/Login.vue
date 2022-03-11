
<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <div class="alert text-center alert-danger" v-if="displayFailMessage"> {{statusMessage}} </div>
    <h1>Please sign in</h1>
    <form v-on:submit.prevent="done()">
      <input class="form-control" type="text" v-model="username"
             placeholder="Username" required autofocus />
      <input class="form-control" type="text" v-model="password"
             placeholder="Password" required autofocus />
      <input class="btn btn-default" type="submit" value="Sign in" />
    </form>
  </div>
</template>

<script>
export default {
  name: 'Login',
  components: {},
  data: () => ({
    username: '',
    password: '',
    statusMessage: '',
    displayFailMessage: false,
  }),
  methods: {
    done() {
      fetch('/api/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          socketID: sessionStorage.getItem('socketID'),
        }),
      })
        .then((resp) => {
          if (!resp.ok) {
            this.$store.commit('setIsAuthenticated', false);
            this.username = '';
            this.password = '';
          }
          return resp.json();
        })
        .then((data) => {
          if (data.msg === 'Success') {
            this.$store.commit('setIsAuthenticated', true);
            this.$store.commit('setCurrentUser', data.currentUser);
            this.$router.push({
              path: 'userpage',
            });
          } else {
            this.displayFailMessage = true;
            this.statusMessage = data.msg;
          }
        })
        .catch((error) => {
          console.error('Authentication failed unexpectedly');
          throw error;
        });
    },
  },
};
</script>

<style scoped>
  .form-control {
    margin: 20px;
    padding: 20px;
  }
</style>
