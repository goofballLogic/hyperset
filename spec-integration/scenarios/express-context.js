var http = require("http"),
	express = require("express");

(function(context) {

	context.App = function(port) {

		var app = express();
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(function(req, res, next) {
			var ret = next();
			//console.log(req.headers, req.body);
			return ret;
		});
		var server = http.createServer(app);
		server.listen(port);

		app.dispose = function() {
			server.close();
		};

		app.trigger = function(method, path, accept, data, contentType, callback) {
			if(typeof contentType === "function") {
				callback = contentType;
				contentType = null;
			} else if(typeof data === "function") {
				callback = data;
				data = null;
			} else if(typeof accept === "function") {
				callback = accept;
				accept = null;
			}

			var options = {
				"host" : "localhost",
				"port" : port,
				"method" : method,
				"path" : path,
				"headers" : { }
			};
			if(accept) options.headers["Accept"] = accept;
			if(contentType) options.headers["Content-Type"] = contentType;

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