var utils = require("../spec/utils/utils"),
	buster = require("buster"),
	hyperset = require("../lib/hyperset"),
	expressadapter = require("../lib/adapter-express"),
	express = require("express"),
	expressContext = require("./scenarios/express-context")
	;

buster.spec.expose();

var rsc = runSaveAndComplete;

describe("Given app, adapter and simple sets config", function() {

	before(function() {
		utils.GivenRepoAndConfig.call(this, "simple");
		this.app = new expressContext.App(3456);
		this.rootUrl = "/rootUrl";
		this.adapter = new expressadapter.Adapter(this.sets, { "root" : this.rootUrl });
		this.adapter.install(this.app);
	});

	after(function() {
		this.app.dispose();
	});
	
	describe("and GET /rootUrl/forms requested as json", function() {

		before(function(done) {
			rsc(this, "getFormsResult", done, this.app.trigger, "GET", "/rootUrl/forms", "application/json");
		});

		it("it should return json", function() {
			var result = this.getFormsResult;
			expect(result[0].headers["content-type"]).toMatch("json");
		});

		it("it should return an object called forms", function() {
			expect(this.json.name).toEqual("forms");
		});

		it("it should contain a self link to /rootUrl/forms", function() {
			var link = findLinkByRel(this.json.links, "self");
			expect(link.href).toEqual("/rootUrl/forms");
		});

		it("it should contain a create link to /rootUrl/forms", function() {
			var link = findLinkByRel(this.json.links, "create");
			expect(link.href).toEqual("/rootUrl/forms");
		});

		describe("and create link is followed", function() {

			before(function(done) {
				var createLink = findLinkByRel(this.json.links, "create");
				rsc(this, "postFormsResult", done, this.app.trigger, "POST", createLink.href, "application/json", "fish");
			});

			it("it should return 201 Created", function() {
				expect(this.postFormsResult[0].statusCode).toEqual(201);
			});

			it("it should return a representation of the created item", function() {
				expect(this.json.data).toEqual("fish");
			});

			describe("and update link is followed", function() {

				before(function(done) {
					var updateLink = findLinkByRel(this.json.links, "update");
					rsc(this, "updateFormsResult", done, this.app.trigger, "PUT", updateLink.href, "application/json", "fish and chips");
				});

				it("it should return 200 OK", function() {
					expect(this.updateFormsResult[0].statusCode).toEqual(200);
				});
			});

		});

	});

	describe("and GET /rootUrl/forms requested without content type", function() {
		
		before(function(done) {
			rsc(this, "getFormsResult", done, this.app.trigger, "GET", "/rootUrl/forms", null);
		});

		it("it should return html", function() {
			expect(this.getFormsResult[0].headers["content-type"]).toMatch("text/html");
		});

	});

});

function findLinkByRel(links, rel) { 
	for(var i = 0; i < links.length; i++) 
		if(links[i].rel==rel) return links[i];
	return null; 
}

function runSaveAndComplete(context, name, done, fn, arg1, argN) {
	var fnArgs = [];
	for(var i = 4; i < arguments.length; i++) { fnArgs.push(arguments[i]); }
	fnArgs.push(function() { context[name] = arguments; delete context.json; try { context.json = JSON.parse(arguments[1]); } catch(e){ } done(); } );
	fn.apply(context, fnArgs);
}
