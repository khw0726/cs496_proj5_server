let mongoose = require('mongoose')
let Schema = mongoose.Schema

let canvasImageSchema = new Schema({
  skillID: String,
  imgURL: String,
  posX: Number,
  posY: Number,
  width: Number,
  height: Number,
  description: String
})

module.exports = mongoose.model('canvasImage', canvasImageSchema)
