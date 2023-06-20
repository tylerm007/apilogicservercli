
let osenv = require('osenv');
let fs = require('fs');
let querystring = require("querystring");
let _ = require('underscore');

module.exports = {
	
	// Get the name of the dot directory.
	getDotDirectory: function(createIfNotExists) {
		let dotDirName = osenv.home() + "/.apilogicserver";
		if ( ! fs.existsSync(dotDirName)) {
			if (createIfNotExists) {
				fs.mkdirSync(dotDirName, 0700);
				return dotDirName;
			}
			else {
				return null;
			}
		}
		return dotDirName;
	},
	
	// Write the given data to the dot file with the given URL
	writeToDotFile: function(name, data) {
		let dotDirName = this.getDotDirectory(true);
		return new Promise(function(resolve,reject) {
					let dotFileName = dotDirName + "/" + querystring.escape(name) + "--" + data.userName;
					let dotFile = fs.openSync(dotFileName, 'w', 0600);
					let numOfBytes = fs.writeSync(dotFile, JSON.stringify(data, null, 2));
					if(numOfBytes>0){
						resolve(numOfBytes);
					}else{
						reject("Data could'nt be written to the dot file :"+dotFileName);
					}
		} );
	},
	
	deleteDotFile: function(url, userName) {
		let dotDirName = this.getDotDirectory(true);
		if ( ! dotDirName) {
			return null;
		}
		let allFiles = fs.readdirSync(dotDirName);
		_.each(allFiles, function(f) {
			if (f === 'currentServer.txt' || f === 'admin' || f === '.DS_Store') {
				return;
			}
			let fileContent = JSON.parse(fs.readFileSync(dotDirName + "/" + f));
			if (fileContent.url === url && fileContent.userName === userName) {
				//console.log('Deleting login file: ' + f);
				fs.unlinkSync(dotDirName + "/" + f);
			}
		});
	},
	
	// Delete the dot file for the given alias.
	// Return true if successful, false otherwise
	deleteDotFileForAlias: function(alias) {
		let dotFile = this.getDotFileForAlias(alias);
		if ( ! dotFile) {
			return false;
		}
		try { fs.unlinkSync(dotFile); } catch(e) {console.log(e);}
		return true;
	},
	
	getDotFileForAlias: function(alias) {
		let dotDirName = this.getDotDirectory(false);
		if ( ! dotDirName) {
			return null;
		}
		let allFiles = fs.readdirSync(dotDirName);
		let dotFile = _.find(allFiles, function(f) {
			if (f === 'currentServer.txt' || f === 'admin') {
				return false;
			}
			try{
				let fileContent = JSON.parse(fs.readFileSync(dotDirName + "/" + f));
				return fileContent.alias === alias;
			} catch(e) {}
		});
		if ( ! dotFile) {
			return null;
		}
		return dotDirName + "/" + dotFile;
	},
	
	getLoginForAlias: function(alias) {
		let dotFileName = this.getDotFileForAlias(alias);
		if ( ! fs.existsSync(dotFileName)) {
			return null;
		}
		let keyObject = JSON.parse(fs.readFileSync(dotFileName));
		//et expiration = Date.parse(keyObject.loginInfo.expiration);
		//if (expiration > new Date()) {
		//	return keyObject;
		//}
		console.log('The JWT key for this server has expired - you need to log in again'.yellow);
		this.deleteDotFileForAlias(alias);
		return null;
	},
	
	// Get the API key for the given URL, if available and current
	getApiKey: function(url, userName) {
		//console.log('Getting API key for user: ' + userName);
		let dotDirName = this.getDotDirectory();
		let dotFileName = dotDirName + "/" + querystring.escape(url) + "--" + userName;
		if ( ! fs.existsSync(dotFileName)) {
			return null;
		}
		let keyObject = JSON.parse(fs.readFileSync(dotFileName));
		//let expiration = Date.parse(keyObject.loginInfo.expiration);
		//if (expiration > new Date()) {
		return keyObject.jwt;
		//}
		//console.log('The Bearer key for this server has expired - you need to log in again'.yellow);
		//this.deleteDotFile(url, userName);
		//return null;
	},
	
	// Write the given URL to ~/.apilogicserver/currentServer.txt
	setCurrentServer: function(url, login) {
		let dotDirName = this.getDotDirectory();
		let dotFileName = dotDirName + "/currentServer.txt";
		let dotFile = fs.openSync(dotFileName, 'w', 0600);
		let record = {
			url: url,
			userName: login.userName,
			jwt: login.jwt,
			expiration: new Date()
		};
		fs.writeSync(dotFile, JSON.stringify(record));
	},
	
	// If there is a ~/.apilogicserver/currentServer.txt, return its content, otherwise null
	getCurrentServer: function() {
		let dotDirName = this.getDotDirectory();
		let dotFileName = dotDirName + "/currentServer.txt";
		if ( ! fs.existsSync(dotDirName)) {
			return null;
		}
		let objStr = fs.readFileSync(dotFileName);
		return JSON.parse(objStr);
	},
	
	unsetCurrentServer: function() {
		let dotDirName = this.getDotDirectory();
		let dotFileName = dotDirName + "/currentServer.txt";
		if (dotDirName) {
			if ( ! fs.existsSync(dotFileName)) {
				 //console.log("not logged into a server");
				 return null;
			}
			fs.unlinkSync(dotFileName,function(err){
				if(err) {console.log("not logged into a server")};
			});
		}
	
	}
};
