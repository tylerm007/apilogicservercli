let dotfile = require('../util/dotfile.js');

module.exports = {
	login: function(cmd) {
		let url = null;
		let jwt = null;
		if (cmd.serverAlias) {
			let loginInfo = dotfile.getLoginForAlias(cmd.serverAlias);
			if ( ! loginInfo) {
				console.log(('Unknown alias: ' + cmd.serverAlias).yellow);
				return;
			}
			url = loginInfo.url;
			jwt = loginInfo.loginInfo.jwt;
		}
		else {
			let loginInfo = dotfile.getCurrentServer();
			url = loginInfo.url;
			jwt = dotfile.getApiKey(loginInfo.url, loginInfo.userName);
			if ( ! jwt) {
				console.log('You cannot run this command because you are not currently logged in. (als login -h)'.red);
				return;
			}
		}
		return {url: url, jwt: jwt};
	}
};