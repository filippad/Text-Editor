
<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <div class="alert text-center alert-danger" v-if="showFailMessage"> {{statusMessage}} </div>
    <h1>Create your new account</h1>
    <form v-on:submit.prevent="register()">
      <input class="form-control" type="text" v-model="username"
             placeholder="Username" required autofocus />
      <input class="form-control" type="text" v-model="password"
             placeholder="Password" required autofocus />
      <input class="form-control" type="text" v-model="repeatedPassword"
             placeholder="Password Repeat" required autofocus />
      <input class="btn btn-default" type="submit" value="Create" />
    </form>
  </div>
</template>

<script>
export default {
  name: 'Register',
  component: {},
  data: () => ({
    username: '',
    password: '',
    repeatedPassword: '',
    showFailMessage: false,
  }),
  methods: {
    register() {
      fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          repeatedPassword: this.repeatedPassword,
        }),
      }).then((resp) => {
        if ((resp.ok)) {
          this.$router.push({
            name: 'login',
          });
        } else {
          this.$router.push({
            path: 'register',
          });
        }
        return resp.json();
      }).then((data) => {
        if (data.msg !== 'Success') {
          this.showFailMessage = true;
          this.statusMessage = data.msg;
        }
      }).catch((error) => {
        console.error('Registration failed unexpectedly');
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
