var mongoose = require("mongoose");
var Schema = mongoose.Schema;
 
var projectSchema = new Schema({
		    	Name: String,
		    	Codes: [{title : String, code : String}]
				    
					});
 
module.exports = mongoose.model('projects',projectSchema);