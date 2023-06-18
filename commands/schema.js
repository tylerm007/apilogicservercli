let Client = require('node-rest-client').Client;
let colors = require('colors');
let _ = require('underscore');
let Table = require('easy-table');
let fs = require('fs');
let dotfile = require('../util/dotfile.js');
let printObject = require('../util/printObject.js');
let login = require('../util/login.js');

module.exports = {
	doSchema: function(action, cmd) {
		if (action === 'list') {
			module.exports.list(cmd);
		}
		else if (action === 'export') {
			module.exports.export(cmd);
		}
		else if (action === 'openapi') {
			module.exports.openapi(cmd);
		}
		else {
			console.log('You must specify an action: list, swagger, or export');
			//program.help();
		}
	},
	
	list: function (cmd) {
		let client = new Client();
		
		let loginInfo = login.login(cmd);
		if ( ! loginInfo)
			return;
		let url = loginInfo.url;
		let apiKey = loginInfo.jwt;

		client.get(url + "/@tables?limit=1000", {
			headers: {
				Authorization: "Bearer " + apiKey ,
				"Content-Type": "application/json"
			}
		}, function(data) {
			if (data.errorMessage) {
				console.log(data.errorMessage.red);
				return;
			}
			printObject.printHeader('Tables');
			let table = new Table();
			_.each(data, function(p) {
				table.cell("Prefix", p.prefix);
				table.cell("Name", p.name);
				table.cell("Entity", p.entity);
				table.newRow();
			});
			table.sort(['Name', 'name']);
			if (data.length === 0) {
				console.log('There are no tables defined for this project'.yellow);
			}
			else {
				console.log(table.toString());
			}
			printObject.printHeader("# tables: " + data.length);
		});
	},
	export: function(cmd) {
		let client = new Client();
		
		let loginInfo = login.login(cmd);
		if ( ! loginInfo)
			return;
		let url = loginInfo.url;
		let apiKey = loginInfo.jwt;
		
		
		let filter = "";
		if (cmd.prefix) {
			filter = "/"+cmd.prefix;
		} else {
			console.log('Missing parameter: please specify datasource --prefix (e.g. demo, main) '.red);
			return;
		}
		
		let toStdout = false;
		if ( ! cmd.file) {
			toStdout = true;
		}
		
		client.get(url + "/@schema"+ filter, {
			headers: {
				Authorization: "Bearer " + loginInfo.jwt,
				"Content-Type": "application/json"
			}
		}, function(data) {
			//console.log('get result: ' + JSON.stringify(data, null, 2));
			if (data.errorMessage) {
				console.log(("Error: " + data.errorMessage).red);
				return;
			}
			if (data.length === 0) {
				console.log(("Error: no such datassource prefix").red);
				return;
			}
			
			if (toStdout) {
				console.log(JSON.stringify(data, null, 2));
			} else {
				let exportFile = fs.openSync(cmd.file, 'w+', 0600);
				fs.writeSync(exportFile, JSON.stringify(data, null, 2));
				console.log(('Tables has been exported to file: ' + cmd.file).green);
			}
		});
	},
	openapi: function(cmd) {
		let client = new Client();
		
		let loginInfo = login.login(cmd);
		if ( ! loginInfo)
			return;
		let url = loginInfo.url;
		let apiKey = loginInfo.jwt;
		
		let toStdout = false;
		if ( ! cmd.file) {
			toStdout = true;
		}
		
		client.get(url + "/@docs", {
			headers: {
				Authorization: "Bearer " + loginInfo.jwt,
				"Content-Type": "application/json"
			}
		}, function(data) {
			//console.log('get result: ' + JSON.stringify(data, null, 2));
			if (data.errorMessage) {
				console.log(("Error: " + data.errorMessage).red);
				return;
			}
			if (data.length === 0) {
				console.log(("Error: no swagger doc found").red);
				return;
			}
			
			if (toStdout) {
				console.log(JSON.stringify(data, null, 2));
			}
			else {
				let exportFile = fs.openSync(cmd.file, 'w+', 0600);
				fs.writeSync(exportFile, JSON.stringify(data, null, 2));
				console.log(('Swagger 2.0 Doc has been exported to file: ' + cmd.file).green);
			}
		});
	}
};
