
let Client = require('node-rest-client').Client;
let colors = require('colors');
let fs = require('fs');
let _ = require('underscore');
let Table = require('cli-table');
let printObject = require('../util/printObject.js');

let dotfile = require('../util/dotfile.js');

module.exports = {
	commandLogin: function (url, cmd) {
		console.log('Logging in...');
		let client = new Client();
		
		if ( ! url) {
			console.log('You must specify the URL to the API Logic Server'.red);
			return;
		}
		if ( ! cmd.username) {
			console.log('You must specify a user name'.red);
			return;
		}
		if ( ! cmd.password) {
			console.log('You must specify a password'.red);
			return;
		}
		
		// Check that the URL looks well-formed
		
		//if (! url.match(/http:\/\/localhost:5656\/.*/) && ! url.match(/^https?:\/\/[\w-\.]+(:\d+)?\/([\w-]+\/)*rest\/[\w-]+\/[\w-]+\/[\w-]+\/?$/)) {
		//	console.log('The URL you specified seems incomplete. It should be in the form:'.red);
		//	console.log('   http[s]://<server>[:<port>]/rest/<account>/<project>/<api-version>'.yellow);
		//	return;
		//}
		
		
		// Remove trailing slash if present
		if (url.match(/.*\/$/)) {
			url = url.substring(0, url.length - 1);
		}
		
		//client.get(url, function(data) {
		
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			client.post(url + "/api/auth/login",
				{
					data: {
						username: cmd.username,
						password: cmd.password
					},
					headers: {"Content-Type": "application/json"}
				},
				function(dataBytes, response) {
					someData = printObject.byteArrayToString(dataBytes)
					if (someData.indexOf("Internal Server Error") > 0) {
						console.log(("Login failed: " + someData).red);
						return;
					}
					data = JSON.parse(someData)
					expiration = dotfile.parseJwtExpiration(data.access_token)
					let fullData = {
						url: url,
						userName: cmd.username,
						alias: cmd.serverAlias,
						jwt: data.access_token,
						expiration: expiration
					};

					dotfile.writeToDotFile(url, fullData)
					.then(
						// Log completion of login process.
						function(val){	
							console.log(('Login successful, this JWT key will expire on: ' + fullData.expiration).green);
						}
						)
					.catch(
						// Login fails if that file cannot be written. 
						function(reason){
							console.log(('Login failed, Reason : ' + reason).green);
							throw "Error logging in";
						}
						);
					dotfile.setCurrentServer(url, fullData);
				}).on('error', function(err) {
					console.log(('ERROR: ' + err).red);
					throw "Error logging in: " + err;
				}
			);
		//});
		
	},
	
	commandLogout: function(url, cmd) {
		if (url) {
			dotfile.deleteDotFile(url);
		}
		else if (cmd.serverAlias) {  
			if (dotfile.deleteDotFileForAlias(cmd.serverAlias)) {
				console.log(('Logout successful for alias ' + cmd.serverAlias).green);
			}
			else {
				console.log(('Unknown alias: ' + cmd.serverAlias).yellow);
			}
		}
		else {
			dotfile.unsetCurrentServer();
			console.log('Logout successful'.green);
		}
	},
	
	commandUseAlias: function(serverAlias, cmd) {
		if ( ! serverAlias) {
			console.log('You must specify a server alias'.red);
			return;
		}
		let login = dotfile.getLoginForAlias(serverAlias);
		if ( ! login) {
			console.log(('No such alias: ' + serverAlias).yellow);
			return;
		}
		dotfile.setCurrentServer(login.url, login);
		console.log(('You are now using server ' + login.url + " as user " + login.userName).green);
	},
	
	commandStatus: function() {
		
		let numAliases = 0;
		let tbl = new Table({
			head: ['Alias', 'ALS Server', 'User']
		});
		let dotDirName = dotfile.getDotDirectory(false);
		if (dotDirName) {
			let allFiles = fs.readdirSync(dotDirName);
			_.each(allFiles, function(f) {
				if (f === 'currentServer.txt' || f === 'admin' || f === '.DS_Store') {
					return;
				}
				let fileContent = JSON.parse(fs.readFileSync(dotDirName + "/" + f));
				//let expiration = Date.parse(fileContent.loginInfo.expiration);
				//if (expiration > new Date()) {
				if (fileContent.alias) {
					tbl.push([fileContent.alias, fileContent.url, fileContent.userName]);
					numAliases++;
				}
				//}
				else {
					dotfile.deleteDotFile(fileContent.url, fileContent.userName);
				}
			});
		}
		
		if (numAliases === 0) {
			console.log('No aliases currently defined'.yellow);
		}
		else {
			console.log("Defined aliases:");
			console.log(tbl.toString());
		}

		// Show the current server, if any
		let currentLogin = dotfile.getCurrentServer();
		if (currentLogin && dotfile.getApiKey(currentLogin.url, currentLogin.userName)) {
			console.log('You are currently logged in to Api Logic server: ' + currentLogin.url.yellow + 
					' as user ' + currentLogin.userName.yellow);
		}
		else {
			console.log('You are not currently logged in to any API Logic Server server'.yellow);
		}
		
	}
};
