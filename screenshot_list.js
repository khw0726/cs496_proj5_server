var mongoose = require("mongoose");
var Schema = mongoose.Schema;
 
var screenShotSchema = new Schema({
		    	reference: String,
		    	imgURL: String
				    
					});
 
module.exports = mongoose.model('screenShots',screenShotSchema);