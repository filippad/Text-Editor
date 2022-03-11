<template>
  <div class="container">
    <section class="col-md-10 col-md-offset-1">
      <div class="row" style="text-align: center;">
        <h1>Documents</h1>
      </div>

      <div class="row">
        <div class="well" v-for="document in getDocuments" @click="redirect(document.id)"
             :key="document.name">
          <div class="row" style="text-align: center;">
            <h4>
              <span>{{ document.name }}</span>
            </h4>
            <div class="col">
              <span :style="{fontFamily: 'italic'}">created by</span>
              <span :style="{fontWeight: 'bold'}">
                  {{ document.createdBy }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'List',
  components: {},
  data: () => ({
    documents: [],
    socket: null,
  }),
  methods: {
    redirect(id) {
      this.$router.push(`/document/${id}`);
    },
  },
  computed: {
    getDocuments() {
      return this.documents;
    },
  },
  created() {
    this.socket = this.$root.socket;

    this.socket.on('addNewDocument', (document) => {
      this.documents = [...this.documents, document];
    });

    this.socket.on('removeDocument', (documentID) => {
      this.documents
        .filter(doc => doc.id !== documentID)
        .reduce((res, doc) => ([...res, doc]), []);
    });

    fetch('/api/documentList')
      .then(res => res.json())
      .then((data) => {
        this.documents = data.list;
      })
      .catch(console.error);
  },
};
</script>
