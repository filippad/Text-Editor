<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <h1>Signed in as {{this.username}}</h1>
    <h3 class="alert text-center alert-danger" v-if="showFailMessage"> {{statusMessage}} </h3>
    <h3 class="alert text-center alert-success" v-if="showSuccessMessage">
      New document created.
    </h3>
    <div id = "add-document">
      <form v-on:submit.prevent="addDocument()">
        <h3>Add new document</h3>
        <input class="form-control" type="text" v-model="docName"
               placeholder="Document name" required autofocus />
        <input class="btn btn-default" type="submit" value="Add" />
      </form>
    </div>
    <div id="remove-document">
      <h3>Manage documents</h3>
      <div class="document-selector" v-bind:key="document.id" v-for="document in documentsComputed">
        <input class= "check-box" type="checkbox" :value="document" v-model="chosenDocuments">
        <div class="card">
          <div class="card-body pt-2 pb-1">
            <h5 class="card-title">{{ document.name }}</h5>
            <h6 class="card-subtitle text-muted mb-2">
              @Created by: {{username}}
            </h6>
          </div>
        </div>
      </div>
      <button type="submit" class="btn my-2 font-bold btn-danger btn-block"
              v-on:click="deleteDocuments">
        DELETE
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'User',
  data: () => ({
    docName: '',
    statusMessage: '',
    showFailMessage: false,
    myDocuments: [],
    chosenDocuments: [],
    socket: null,
    username: '',
    showSuccessMessage: false,
  }),
  methods: {
    addDocument() {
      fetch('/api/addDocument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docName: this.docName,
          currentUser: this.$store.state.currentUser.id,
        }),
      })
        .then(resp => resp.json())
        .then((data) => {
          if (data.msg === 'Success') {
            this.showFailMessage = false;
            this.showSuccessMessage = true;
            this.docName = '';
          } else {
            this.showFailMessage = true;
            this.showSuccessMessage = false;
            this.statusMessage = data.msg;
            this.$router.push('/login');
          }
        })
        .catch((error) => {
          console.error('Unable to save new document.');
          throw error;
        });
    },
    deleteDocuments() {
      console.log(`About to send: ${this.chosenDocuments}`);
      fetch('/api/deleteDocuments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentUser: this.$store.state.currentUser.id,
          documents: this.chosenDocuments,
        }),
      })
        .then(resp => resp.json())
        .then((data) => {
          if (data.msg !== 'Success') {
            this.saveFailure = true;
            this.statusMessage = data.msg;
          } else {
            this.saveFailure = false;
          }
          this.chosenDocuments = [];
          this.showSuccessMessage = false;
        })
        .catch((error) => {
          console.error('Unable to delete documents');
          throw error;
        });
    },
  },
  computed: {
    documentsComputed() {
      return this.myDocuments;
    },
  },
  created() {
    this.username = this.$store.state.currentUser.username;
    this.socket = this.$root.socket;

    this.socket.on(`user${this.$store.state.currentUser.id}newDoc`, (doc) => {
      this.myDocuments = [...this.myDocuments, doc];
    });

    this.socket.on(`user${this.$store.state.currentUser.id}deleteDoc`, (docId) => {
      this.myDocuments = this.myDocuments
        .filter(doc => doc.id !== docId)
        .reduce((res, doc) => ([...res, doc]), []);
    });

    fetch('/api/getMyDocuments', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentUser: this.$store.state.currentUser.id,
      }),
    })
      .then(resp => resp.json())
      .then((data) => {
        if (data.msg !== 'Success') {
          this.saveFailure = true;
          this.statusMessage = data.msg;
        } else {
          this.saveFailure = false;
        }
        this.myDocuments = data.myDocuments;
      })
      .catch((error) => {
        console.error('Unable to remove timeslots');
        throw error;
      });
  },
};

</script>

<style scoped>
  div {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .document-selector {
    display: flex;
    flex-direction: row;
  }

  .check-box {
    float: left;
    margin: 20px;
  }
</style>
