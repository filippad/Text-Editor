/**
 * @class Document
 */
class Document {
  constructor(id, name, createdBy, content) {
    this.id = id;
    this.name = name;
    this.createdBy = createdBy;
    this.content = content;
  }

  changeContent(content) {
    this.content = content;
  }
}

module.exports = Document;
