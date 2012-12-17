var http = require("http"),
	express = require("express");

(function(context) {

	context.App = function(port) {

		var app = express();
		var server = http.createServer(app);
		server.listen(port);

		app.dispose = function() {
			server.close();
		};

		app.trigger = function(method, path, accept, data, callback) {
			if(typeof data === "function") {
				callback = data;
				data = null;
			}
			var options = {
				"host" : "localhost",
				"port" : port,
				"method" : method,
				"path" : path,
				"headers" : { }
			};
			if(accept) options.headers.accept = accept;
			
			var req = http.request(options, function(res) {
				var buffer = "";
				var thrown = null;
				res.on("error", function(err) { thrown = err; });
				res.on("data", function(data) { buffer += data; });
				res.on("end", function() { callback(res, buffer, thrown); });
			});
			if(data) req.write(data);
			req.end();
			return req;
		};

		return app;
	};


})(module.exports);