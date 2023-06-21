#!/usr/bin/env node

/**
 * A command-line interface for API Logic Server (an open source Python framework based on Flask, SQLAlchemy, LogicBank, and OpenAPI)
 */

let program = require('commander');
let path = require('path');
let pkg = require('./package.json');
let login = require('./commands/login.js');
let get = require('./commands/get.js');
let post = require('./commands/post.js');
let putdata = require('./commands/putdata.js');
let del = require('./commands/delete.js');
let describe = require('./commands/describe.js');
let dotfile = require('./util/dotfile.js');
let schema = require('./commands/schema.js');

program
	.version(pkg.version);

program
	.command('login <url>')
	.description('Login to an API Logic Server')
	.option('-u, --username <username>', 'User name (admin account)')
	.option('-p, --password <password>', 'Password')
	.option('-a, --serverAlias <serverAlias>', 'Alias for this connection')
	.action(login.commandLogin);

program
	.command('logout [url]')
	.description('Logout from the current server, or a specific server')
	.option('-a, --serverAlias <serverAlias>', 'Alias from which to logout')
	.action(login.commandLogout);

program
	.command('use <alias>')
	.description('Use the specified server by default')
	.action(login.commandUseAlias);

program
	.command('status')
	.description('Show the current server, and any defined server aliases')
	.action(login.commandStatus);

program
	.command('get <resource>')
	.description('Retrieve some data for the given resource/table/view')
	.option('-k, --pk <pk>', 'Primary key of the table or resource')
	.option('-f, --filter <filter[key]=value>', 'Optional: filter, e.g. filter[colname]=value)')
	.option('-s, --order <order=column>', 'Optional: order, e.g. order=balance')
	.option('-z, --pagesize <pagesize>', 'Optional: up to how many rows to return per level')
	.option('-o, --offset <offset>', 'Optional: offset for starting next batch')
	.option('-m, --format <format>', 'Optional: format of output in json only')
	.option('--truncate <length>', 'Optional: truncate values at this many characters (default 20)')
	.option('-j, --jsonfile <filename>', 'Name of file to write JSON output')
	.option('-a, --serverAlias <serverAlias>', 'Optional: alias of the server to use if other than the current default server')
	.action(get.commandGet);

program
	.command('post <resource>')
	.description('Insert json data to <resource> endpoint')
	.option('-j, --json <json>', 'JSON string in quotes ' + "'{a: 1, b: 'c'}'" + ' for the data being inserted ')
	.option('-f, --jsonfile <jsonfile>', 'Name of a file containing JSON to be inserted, or stdin to read from stdin')
	.option('-m, --format <format>', 'Optional: format of output in json format')
	.option('--output <filename>', 'Optional: name of output file to write post results')
	.option('-a, --serverAlias <serveralias>', 'Optional: alias of the server to use if other than the current default server')
	.action(function(resource, cmd) { post.commandPost(resource, cmd, 'post'); });

program
	.command('put <resource>')
	.description('Update (aka patch) json data to <resource> endpoint')
	.option('-k, --pk <pk>', 'Primary key of the table or resource')
	.option('-j, --json <json>', 'JSON string in quotes ' + "'{a: 1, b: 'c'}'" + ' for the data being updated ')
	.option('-f, --jsonfile <jsonfile>', 'Name of a file containing JSON to be updated, or stdin to read from stdin')
	.option('--output <filename>', 'Optional: name of output file to write put results')
	.option('-m, --format <format>', 'Optional: format of output, in json format')
	.option('-a, --serverAlias <serverAlias>', 'Optional: alias of the server to use if other than the current default server')
	.action(function(resource, cmd) { post.commandPost(resource, cmd, 'patch'); });

program
	.command('delete <resource>')
	.description('Delete a single row using primary key and checksum')
	.option('-k, --pk <pk>', 'Required: Primary key of the object to delete')
	.option('-c, --checksum <checksum>', 'Required: checksum for the object to delete, or "override". If not specified, the object will be retrieved then deleted.')
	.option('-m, --format <format>', 'Optional: format of output, in json format')
	.option('-a, --serverAlias <serverAlias>', 'Optional: alias of the server to use if other than the current default server')
	.action(del.commandDelete);
	
program
	.command('putdata <resource>')
	.description('Update a single row/column with an upload using a file  (-k <key> -c <attr> -f foo.jpg)')
	.option('-k, --pk <pk>', 'Required: Primary key of the object to delete')
	.option('-c, --attrname <attr>','Required: Attribute Name to upload file content')
	.option('-f, --file <file>', 'Name of a file to upload to a specific column')
	.option('--output <filename>', 'Optional: name of output file to write putdata results')
	.option('-a, --serverAlias <serverAlias>', 'Optional: alias of the server to use if other than the current default server')
	.action(function(resource, cmd) { putdata.commandPost(resource, cmd, 'put'); });

program
	.command('describe <resource>')
	.description('Describe the specified resource, can be: tables[/tablename], views[/viewname], resources, functions, license, serverinfo')
	.option('-a, --serverAlias <serverAlias>', 'Optional: alias of the server to use if other than the current default server')
	.action(describe.commandDescribe);


program
	.command('schema <list|openapi|export>')
	.description('Administer API project options for an account.')
	.option('--prefix [name]','This is the datasource prefix for @schema')
	.option('--project_ident [project_ident]','The project ident that will be marked as used' )
	.option('--file [filename]', '[Optional] Name of file to settings for import/export (if not provided stdin/stdout used for export)')
	.action(schema.doSchema);

program.parse(process.argv);

if (process.argv.length < 2) {
	console.log('You must specify a command'.red);
	program.help();
}

exports.program = program;
