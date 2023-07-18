let Client = require('node-rest-client').Client;
let _ = require('underscore');
let colors = require('colors');
let querystring = require("querystring");
let fs = require('fs');
let dotfile = require('../util/dotfile.js');
let printObject = require('../util/printObject.js');
let login = require('../util/login.js');


module.exports = {
	commandGet: function (resName, cmd) {
		let client = new Client();
		
		let loginInfo = login.login(cmd);
		let url = loginInfo.url;
		let jwt = loginInfo.jwt;

		if ( ! resName) {
			console.log('Error: a resource or table name must be specified'.red);
			return;
		}
		
		let params = "";
		if (cmd.filter) {
			params += params.length ? "&" : "?";
			params += querystring.escape(cmd.filter);
		}
		
		if (cmd.sort) {
			params += params.length ? "&" : "?";
			params +=  querystring.escape(cmd.sort);
		}
		
		if (cmd.pagesize) {
			params += params.length ? "&" : "?";
			params += "page[limit]=" + cmd.pagesize; 
		}
		
		
		if (cmd.offset) {
			params += params.length ? "&" : "?";
			params += "page[offset]=" + cmd.offset; 
		}
		
		
		if (cmd.format) {
			if (cmd.format !== "text" && cmd.format !== "json" && cmd.format !== "compactjson") {
				console.log('Invalid value for option '.red + 'format'.blue.bgWhite + 
						' - valid values are '.red + 'text'.underline + ', ' + 'json'.underline + 
						' and '.red + 'compactjson'.underline);
				return;
			}
		}
		
		let objUrl = resName;
		if (cmd.pk) {
			objUrl += "/" + cmd.pk;
		}
		//console.log(objUrl + params);
		//?page%5Boffset%5D=0&page%5Blimit%5D=10&sort=id&filter%5Bid%5D=1
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
		let startTime = new Date();
		client.get(url + "/" + objUrl + params, {
			headers: {
				Authorization: "Bearer " + jwt,
				"Content-Type": "application/json"
			}
		}, function(dataBytes) {
			//console.log('get result: ' + JSON.stringify(data, null, 2));
			let endTime = new Date();
			data = printObject.byteArrayToString(dataBytes)//add file export option here.
			if (data.indexOf("Internal Server Error") > 0) {
				console.log(("Error: " + data).red);
				return;
			}
			
			if (cmd.jsonfile) {
				let exportFile = fs.openSync(cmd.jsonfile, 'w+', 0600);
				fs.writeSync(exportFile, data);
				console.log(('JSON data has been exported to file: ' + cmd.jsonfile).green);
				return;
			}
			let termWidth = 80;
			if (process.stdout.getWindowSize) {// Does not exist if output is redirected
				termWidth = process.stdout.getWindowSize()[0];
			}

			if (!cmd.format || cmd.format === "text") {
				let header = "GET for " + resName + ": ";
				while (header.length < termWidth ){
					header += " ";
				}
				console.log(header.bgWhite.blue);
			}
						
			if (cmd.format == "json") {
				//console.log(JSON.stringify(data, null, 2));
				console.log(JSON.parse(JSON.stringify(data,2, null)))
			}
			else if (cmd.format == "compactjson") {
				//console.log(JSON.stringify(data));
				console.log(data)
			}
			else {
				if (Array.isArray(data)) {
					_.each(data, function(obj) {
						//printObject.printObject(obj, null, 0, null, cmd.truncate);
						console.log(data)
					});
				}
				else {
					//printObject.printObject(data, cmd.resource, 0, null, cmd.truncate);
					console.log(data)
				}
			}
			
			if (!cmd.format || cmd.format === "text") {
				let trailer = "Request took: " + (endTime - startTime) + "ms";
				trailer += " - # top-level objects: ";
				if (Array.isArray(data)) {
					if (data.length == 0) {
						console.log('No rows returned'.yellow);
					}
					let nextBatchPresent = false;
					if (data.length > 0) {
						nextBatchPresent = data["data"] && 
							data["data"].next_batch;
					}
					trailer += data.length - (nextBatchPresent ? 1 : 0);
				}
				else
					trailer += "1";
				while (trailer.length < termWidth){
					trailer += " ";
				}
				console.log(trailer.bgWhite.blue);
				console.log(' '.reset);
			}
		});
	}
};
