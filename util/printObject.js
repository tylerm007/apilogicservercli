// Print a JSON object as succinctly as possible, including subobjects

var _ = require('underscore');
let colors = require('colors');

module.exports = {
	printObject: function(obj, prefix, indent, action) {
		let termWidth = 80;
		if (process.stdout.getWindowSize) {
			try {
				termWidth = process.stdout.getWindowSize()[0];
			}
			catch(e) {
				// Do nothing -- we're most likely in a headless environment
			}
		}

		let objSum = "";
		
		if (action) {
			switch(action) {
				case 'INSERT': objSum += "I ".cyan; break;
				case 'UPDATE': objSum += "U ".magenta; break;
				case 'DELETE': objSum += "D ".yellow; break;
			}
		}
		
		
//		for (let i = 0; i < indent; i++) {
//			objSum = " " + objSum;
//		}
		
		// If this is the next page object, treat as such
		if (obj['data'] && obj['data'].next_batch) {
			objSum += "more...";
			console.log(objSum.cyan);
			nextBatch = true;
			return;
		}
		
		let entNameLength = 0;
		let pkLength = 0;
		if (obj['data']) {
			let entName = obj['data'].href.match(/.*\/([^/]+)\/[^/]+$/);
			entNameLength = entName[1].length;
			let pk = obj['data'].href.match(/.*\/(.+)$/);
			pkLength = pk[1].length;
			objSum += entName[1].green + "/" + pk[1].cyan;
		}
		let numPropsShown = 0;
		let objectProps = {};
		let lineLength = indent + entNameLength + pkLength + 3;
		if (prefix) {
			lineLength += prefix.length + 2;
		}
		for (let prop in obj) {
			if ("data" === prop) { continue; }
			let val = obj[prop];
			//console.log('Property ' + prop + ' is of type ' + typeof val + " : " + val);
			if (val === null) {
				val = "[null]";
			}
			else if (Array.isArray(val)) {
				if (val.length > 0 && (typeof val[0]) === 'object') {
					objectProps[prop] = val;
					continue;
				}
				else {
					let varStr = "[";
					_.each(val, function(v) {
						if (varStr.length > 1) {
							varStr += ",";
						}
						varStr += v;
					});
					val = varStr + "]";
				}
			}
			else if ((typeof val) === 'object') {
				objectProps[prop] = val;
				continue;
			}
			else {
				val = "" + obj[prop];
				if (typeof val == 'string')
					val = val.replace(/\n/g, "");
			}
			lineLength += prop.length + 2;
			if (val.length > 20)
				val = val.substring(0, 17) + "...";
			lineLength += val.length;
			if (lineLength > termWidth) { continue; }
			objSum += " " + (prop + ":").yellow + val;
			numPropsShown++;
		}
		if (prefix) {
			objSum = prefix + ": " + objSum;
		}
		for (let i = 0; i < indent; i++) {
			objSum = " " + objSum;
		}
		console.log(objSum);
		
		for (let subObjName in objectProps) {
			let val = objectProps[subObjName];
			if (Array.isArray(val)) {
				_.each(val, function(obj) {
					module.exports.printObject(obj, subObjName, indent + 2);
				});
			}
			else {
				module.exports.printObject(objectProps[subObjName], subObjName, indent + 2);
			}
		}
	},
	
	printHeader: function(str) {
		let termWidth = 100;
		try{
			if (process.stdout.getWindowSize) { // Does not exist if output is redirected
				termWidth = process.stdout.getWindowSize()[0];
			}
		} catch(e){}
		
		while (str.length < termWidth ) {
			str += " ";
		}
		console.log(str);//.bgWhite.blue
	},
	
	printTrailer: function(str) {
		let termWidth = 100;
		if (process.stdout.getWindowSize) { // Does not exist if output is redirected
			termWidth = process.stdout.getWindowSize()[0];
		}
		
		while (str.length < termWidth ) {
			str += " ";
		}
		console.log(str);//.bgWhite.blue
		console.log("");
	},
	
	getScreenWidth: function() {
		if (process.stdout.getWindowSize) { // Does not exist if output is redirected
			return process.stdout.getWindowSize()[0];
		}
		else {
			return 100;
		}
	},

	byteArrayToString: function(byteArray){

		// Otherwise, fall back to 7-bit ASCII only
		let result = "";
		for (let i=0; i<byteArray.byteLength; i++){
			result += String.fromCharCode(byteArray[i])
		}/*from   w  ww . ja v a 2 s .  co  m*/
		return result;
	}
};

