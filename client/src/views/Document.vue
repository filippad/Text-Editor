<template>
  <div class="container fill" style="background:rgb(248, 249, 250); overflow: scroll">
    <section class="col-md-10 col-md-offset-1" style="text-align: center">
      <div class="row" style="text-align: center;">
        <h1>{{ document.name }}</h1>
      </div>
      <textarea
        id="textarea-rows"
        :rows="rows"
        :cols="cols"
        :maxlength="maxChars"
        :style="textAreaStyleObject"
        v-model="getDocuments"
        @input="emitToServer"
      ></textarea>
    </section>
    <button @click="testEmit">click me</button>
    <p>{{testingText}}</p>
    <p>{{socketID}}</p>
  </div>
</template>

<script>
export default {
  name: 'Document',
  components: {},
  data() {
    return {
      socket: null,
      document: {},
      cols: 74, // 74
      rows: 5, // 49
      maxChars: 400,
      testingText: '',
      socketID: '',
      textAreaStyleObject: {
        resize: 'none',
        overflow: 'scroll',
        whiteSpace: 'preWrap',
        margin: '5px',
        padding: '20px',
        boxShadow: 'rgb(60 64 67 / 15%) 0px 1px 3px 1px',
      },
    };
  },
  methods: {
    emitToServer(event) {
      const val = event.target.value;
      this.socket.emit(`document${this.document.id}ChangeFromClient`, {
        docID: this.document.id,
        content: val,
      });
    },
    testEmit() {
      console.log('clicked!');
      this.socket.emit('testingendpoint', this.document.id);
    },
  },
  computed: {
    getDocuments() {
      return this.document.content;
    },
  },
  created() {
    this.socket = this.$root.socket;

    this.socket.on('removeDocument', () => {
      this.document.content = '';
      this.$router.push('/list');
    });

    this.socket.on('testingserver', (msg) => {
      this.testingText = msg;
    });


    fetch(`/api/document/${this.$route.params.documentID}/join`)
      .then((resp) => {
        if (!resp.ok) {
          // if something went wrong i.e document deleted redirect to list
          this.$router.push('/list');
          // throw new Error(`Unexpected failure when joining room:
          // ${this.$route.params.documentID}`);
        }
        return resp.json();
      })
      .catch(console.error)
      .then((data) => {
        this.document = data.doc;

        this.socket.on(`serverUpdateDocument${this.document.id}`, (payload) => {
          console.log('server websocket payload: ', payload);
          this.document.content = payload;
        });

        this.socket.on(`serverErrorDocument${this.document.id}`, () => {
          this.$router.push('/list');
        });
      });
  },
  // beforeRouteEnter(to, from, next) {
  //   const socketID = sessionStorage.getItem('socketID');
  //   // check that the socketID has finished loading into sessionstorage otherwise redirect back
  //   if (socketID === undefined || socketID === null) {
  //     next((vm) => {
  //       vm.$router.push('/list');
  //     });
  //   } else {
  //     next();
  //   }
  // },
  // beforeDestroy() {
  //   console.log(sessionStorage.getItem('socketID'));
  //   fetch(`/api/document/${this.document.id}/leave`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       socketID: sessionStorage.getItem('socketID'),
  //     }),
  //   }).then((resp) => {
  //     if (!resp.ok) {
  //       throw new Error(`Unexpected failure when joining room:
  //         ${this.$route.params.documentID}`);
  //     }
  //     return resp.json();
  //   })
  //     .catch(console.error)
  //     .then((data) => {
  //       console.log(data.msg);
  //     });
  // },
};
</script>
