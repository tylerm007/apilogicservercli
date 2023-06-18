let Client = require('node-rest-client').Client;
let fs = require('fs');
let _ = require('underscore');
let colors = require('colors');
let querystring = require("querystring");

let dotfile = require('../util/dotfile.js');
let printObject = require('../util/printObject.js');

module.exports = {
	commandDelete: function (resource, cmd) {
		let client = new Client();
		let url = null;
		let apiKey = null;
		if (cmd.serverAlias) {
			let login = dotfile.getLoginForAlias(cmd.serverAlias);
			if ( ! login) {
				console.log(('Unknown alias: ' + cmd.serverAlias).red);
				return;
			}
			url = login.url;
			apiKey = login.jwt;
		}
		else {
			let login = dotfile.getCurrentServer();
			url = login.url;
			apiKey = dotfile.getApiKey(login.url, login.userName);
		}
		
		if ( ! (resource && cmd.pk && cmd.checksum) && !cmd.jsonfile) {
			console.log('Error: a resource or table name must be specified, or a JSON file must be specified'.red);
			return;
		}
		
		function delObject(url, checksum) {
			client['delete'](url + "?checksum=" + checksum, {
				headers: {
					Authorization: "Bearer " + apiKey ,
					"Content-Type": "application/json"
				}
			}, function(dataResp) {
				//console.log(data);
				numDeletedObjects++;
				data = printObject.byteArrayToString(dataResp)
				if (data.errorMessage) {
					console.log(("Error: " + data.errorMessage).red);
					return;
				}
				if (cmd.format == "json") {
					console.log(JSON.stringify(data, null, 2));
				}
				else if (cmd.format == "compactjson") {
					console.log(JSON.stringify(data));
				}
				else {
					//_.each(data.txsummary, function(obj) {
					//	printObject.printObject(obj, obj['@metadata'].entity, 0, obj['@metadata'].verb);
					//	numAffectedObjects++;
					//});
				}
			}, function(e) {
				console.log(('Error while deleting: ' + e).red);
				numDeletedObjects++;
			});
		}

		// Print the banner
		let termWidth = 80;
		if (process.stdout.getWindowSize) {
			termWidth = process.stdout.getWindowSize()[0];
		}

		if (!cmd.format || cmd.format === "text") {
			let header = "DELETE for " + resource + ": ";
			while (header.length < termWidth )
				header += " ";
			console.log(header.bgWhite.blue);
		}
		
		let startTime = new Date();
		let numObjectsToDelete = 0;
		let numDeletedObjects = 0;
		let numAffectedObjects = 0;
		
		// If we need to delete a whole file
		if (cmd.jsonfile) {
			if (cmd.jsonfile === 'stdin') {
				cmd.jsonfile = '/dev/stdin';
			}
			else {
				if ( ! fs.existsSync(cmd.jsonfile)) {
					console.log('Unable to open JSON file: '.red + cmd.jsonfile.magenta);
					return;
				}
			}
			let json = fs.readFileSync(cmd.jsonfile);
			let objs = null;
			try {
				objs = JSON.parse(json);
			}
			catch(e) {
				console.log('Invalid JSON in file: '.red + cmd.jsonfile.magenta);
				return;
			}
			if (Array.isArray(objs)) {
				_.each(objs, function(obj) {
					if (obj['@metadata'] && obj['@metadata'].href) {
						numObjectsToDelete++;
					}
				});
				_.each(objs, function(obj) {
					if (obj['@metadata'] && obj['@metadata'].href) {
						delObject(obj['@metadata'].href, obj['@metadata'].checksum);
					}
				});
			}
			else {
				if (objs['@metadata'] && objs['@metadata'].href) {
					numObjectsToDelete++;
					delObject(objs['@metadata'].href, objs['@metadata'].checksum);
				}
			}
		}
		else {
			numObjectsToDelete = 1;
			delObject(url + "/" + resource + "/" + cmd.pk, cmd.checksum);
		}
		
		function printTrailer() {
			if (numDeletedObjects < numObjectsToDelete) {
				setTimeout(printTrailer, 50);
				return;
			}
			let endTime = new Date();
			if (!cmd.format || cmd.format === "text") {
				let trailer = "Request took: " + (endTime - startTime) + "ms";
				trailer += " - # objects deleted: " + numDeletedObjects;
				trailer += " - # objects touched: ";
				if (numAffectedObjects == 0) {
					console.log('No objects touched'.yellow);
				}
				trailer += numAffectedObjects;
				while (trailer.length < termWidth)
					trailer += " ";
				console.log(trailer.bgWhite.blue);
				console.log(' '.reset);
			}	
		}
		printTrailer();
	}
};
