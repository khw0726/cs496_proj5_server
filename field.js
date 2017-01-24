let mongoose = require('mongoose')
let Schema = mongoose.Schema

let skillSchema = new Schema({
  name: String,
  id: String
})

let fieldSchema = new Schema({
  name: String,
  skills: [skillSchema]
})

module.exports = mongoose.model('field', fieldSchema)
