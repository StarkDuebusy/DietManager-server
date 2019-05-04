function ImgParser(){
	this.convertToBuffer = function(fileName){
		var fs = require('fs');
		var dirProfileIMG = __dirname + '/../resource/raw/image/profile/'+ fileName;
		
		try {
				var img = fs.readFileSync(dirProfileIMG);
				return new Buffer(img).toString('base64');
		} catch (e) {
			console.log(e.message);
			return undefined;
		}
	}
}

module.exports = ImgParser;