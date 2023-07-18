let Client = require('node-rest-client').Client;
let fs = require('fs');
let _ = require('underscore');

let dotfile = require('../util/dotfile.js');
let printObject = require('../util/printObject.js');

module.exports = {
	commandPost: function (resource, cmd, verb) {
		let client = new Client();
		let url = null;
		let apiKey = null;
		if (cmd.serverAlias) {
			let login = dotfile.getLoginForAlias(cmd.serverAlias);
			if (!login) {
				console.log(('Unknown alias: ' + cmd.serverAlias).red);
				return;
			}
			url = login.url;
			apiKey = login.loginInfo.jwt;
		} else {
			let login = dotfile.getCurrentServer();
			url = login.url;
			apiKey = dotfile.getApiKey(login.url, login.userName);
		}
		if (!resource) {
			console.log('Error: a resource or table name must be specified'.red);
			return;
		}
		if (!cmd.json && !cmd.jsonfile) {
			console.log('Error: a JSON object must be specified in the -j/--json option, or with the -f/--jsonfile option'.red);
			return;
		}

		if (cmd.jsonfile) {
			if (cmd.jsonfile === 'stdin') {
				cmd.jsonfile = '/dev/stdin';
			} else {
				if (!fs.existsSync(cmd.jsonfile)) {
					console.log('Unable to open JSON file: '.red + cmd.jsonfile.magenta);
					return;
				}
			}
			cmd.json = "" + fs.readFileSync(cmd.jsonfile);
		}

		try {
			JSON.parse(cmd.json);
		} catch (e) {
			console.log('Error: invalid JSON'.red + " : " + e);
			return;
		}
		//console.log(cmd.json);
		let startTime = new Date();
		let fullResource = resource;
		if (cmd.pk) {
			fullResource += "/" + cmd.pk;
		}
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
		client[verb](url + "/" + fullResource, {
			data: cmd.json,
			headers: {
				Authorization: "Bearer " + apiKey,
				"Content-Type": "application/json"
			}
		}, function (dataResp) {
			//console.log(data);
			data = printObject.byteArrayToString(dataResp)
			let endTime = new Date();
			if (data.indexOf("errors") > 0 || data.indexOf("message") > 0) {
				console.log(("Error: " + data).red);
				return;
			}
			if (cmd.output) {
				let filename = cmd.output;
				let exportFile = fs.openSync(filename, 'w+', 0600);
				fs.writeSync(exportFile, JSON.stringify(data, null, 2));
				console.log(('POST request has been exported to file: ' + filename).green);
			}
			let termWidth = 80;
			if (process.stdout.getWindowSize) { // May be null if output is redirected
				termWidth = process.stdout.getWindowSize()[0];
			}

			if (!cmd.format || cmd.format === "text") {
				let header = verb.toUpperCase() + " for " + resource + ": ";
				while (header.length < termWidth)
					header += " ";
				console.log(header.bgWhite.blue);
			}

			if (cmd.format == "json") {
				console.log(JSON.parse(data));
			} else if (cmd.format == "compactjson") {
				console.log(JSON.stringify(data));
			} else {
				console.log(JSON.stringify(data));
			}

			if (!cmd.format || cmd.format === "text") {
				let trailer = "Request took: " + (endTime - startTime) + "ms";
				trailer += " - # objects touched: ";
				if (data.length == 0) {
					console.log('No data returned'.yellow);
				}
				trailer += data.length;
				while (trailer.length < termWidth)
					trailer += " ";
				console.log(trailer.bgWhite.blue);
				console.log(' '.reset);
			}
		}, function(e) {
			console.log(('Error while post/patch: ' + e).red);
		});
	}
};
