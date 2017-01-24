var mongoose = require("mongoose");
var Schema = mongoose.Schema;
 
var descriptionSchema = new Schema({
		    	skillID: String,
		    	cardlist: [{id: Number, image: String, title: String, description: String, tag: String}],
		    	timeline: String,
		    	codes: [{title : String, code : String}]
					});
 
module.exports = mongoose.model('description', descriptionSchema);