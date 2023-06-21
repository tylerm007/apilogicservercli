let Client = require('node-rest-client').Client;
let _ = require('underscore');
let colors = require('colors');
let querystring = require("querystring");
let Table = require('easy-table');
let CLITable = require('cli-table');

let dotfile = require('../util/dotfile.js');
let printObject = require('../util/printObject.js');
let login = require('../util/login.js');
let get = require('../commands/get.js');

module.exports = {
	commandDescribe: function (resName, cmd) {
		let client = new Client();

		let loginInfo = login.login(cmd);
		if ( ! loginInfo) {
			return;
		}
		let url = loginInfo.url;
		let apiKey = loginInfo.jwt;

		if ( ! resName) {
			console.log('Error: a resource or table name must be specified'.red);
			return;
		}
		
		let termWidth = 80;
		if (process.stdout.getWindowSize) // Does not exist if output is redirected
			termWidth = process.stdout.getWindowSize()[0];

		let startTime = new Date();
		client.get(url + "/" + resName, {
			headers: {
				Authorization: "Bearer " + apiKey,
				"Content-Type": "application/json"
			}
		}, function(dataResp) {
			let endTime = new Date();
			data = printObject.byteArrayToString(dataResp)
			if (data.errorMessage) {
				console.log(("Error: " + data.errorMessage).red);
				return;
			}
			
			if (resName === 'tables') {
				module.exports.describeTables(data, "Table");
			}
			if (resName === 'resources') {
				module.exports.describeResources(data, "Resource");
			}
			if (resName === 'procedures') {
				module.exports.describeProcs(data, "Stored Proceduers");
			}
			if (resName === 'views') {
				module.exports.describeTables(data, "View");
			}
			else if (resName.match(/tables\/.+/)) {
				module.exports.describeTable(data, "Table");
			}
			else if (resName === 'functions') {
				module.exports.describeFunction(data, "Function");
			}
			else if (resName.match(/views\/.+/)) {
				module.exports.describeTable(data, "View");
			}
		});
	},
	
	printHeader: function(str) {
		let termWidth = 100;
		if (process.stdout.getWindowSize) // Does not exist if output is redirected
			termWidth = process.stdout.getWindowSize()[0];
		
		while (str.length < termWidth )
			str += " ";
		console.log(str.bgWhite.blue);
	},
	
	describeResources: function(data, type) {
		
		module.exports.printHeader("All " + type + "s ");
		let table = new Table();
		_.each(data, function(tbl) {
			table.cell("Type", tbl.resource_type);
			table.cell("Version", tbl.apiVersion);
			table.cell(type, tbl.name);
			table.cell("href", tbl['@metadata'].href );
			table.newRow();
		});
		console.log(table.toString());
		module.exports.printHeader("# " + type + "s: " + data.length);
	},
	
	describeProcs: function(data, type) {
		
		module.exports.printHeader("All " + type + "s ");
		let table = new Table();
		_.each(data, function(tbl) {
			table.cell("Prefix", tbl.prefix);
			table.cell("entity", tbl.entity);
			table.cell(type, tbl.name);
			table.cell("href", tbl['@metadata'].href );
			table.newRow();
		});
		console.log(table.toString());
		module.exports.printHeader("# " + type + "s: " + data.length);
	},
	describeTables: function(data, type) {
		
		module.exports.printHeader("All " + type + "s ");
		let table = new Table();
		_.each(data, function(tbl) {
			table.cell("DB", tbl.prefix);
			table.cell(type, tbl.entity);
			table.newRow();
		});
		console.log(table.toString());
		module.exports.printHeader("# " + type + "s: " + data.length);
	},
	describeFunction: function(data, type) {
		
		module.exports.printHeader("All " + type + "s ");
		let table = new Table();
		_.each(data, function(tbl) {
			table.cell("Signature", tbl.signature);
			table.cell("Resources", tbl.resource_names);
			table.cell("isActive", tbl.is_active);
			table.newRow();
		});
		console.log(table.toString());
		module.exports.printHeader("# " + type + "s: " + data.length);
	},
	describeTable: function(data, type) {

		module.exports.printHeader("Description of " + type + " " + data.name.magenta);
		
		let allCols = _.indexBy(data.columns, "name");
		
		let pkCols = {};
		if (data.primaryKeyColumns) {
			_.each(data.primaryKeyColumns, function(pkColName) {
				pkCols[pkColName] = allCols[pkColName];
			});
		}

		let table = new Table();
		_.each(data.columns, function(col) {
			table.cell("Name", col.name);
			table.cell("Type", col.type);
			table.cell("Size", col.size ? col.size : "", Table.padLeft);
			table.cell("PK", pkCols[col.name] ? "*" : "");
			table.newRow();
		});
		console.log(table.toString());
		module.exports.printHeader("# columns " + data.columns.length);
	},
	
	// When we just want to show name/value pairs
	asTable: function(data) {
		let table = new Table();
		_.each(data, function(v, n) {
			//let row = {};
			//row[n] = v;
			//table.push(row);
			table.cell(n,v);
			//table.newRow();
		});
		table.newRow();
		console.log(table.toString());
	}
};

