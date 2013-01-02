var utils = require("../spec/utils/utils"),
	buster = require("buster"),
	hyperset = require("../lib/hyperset"),
	expressadapter = require("../lib/adapter-express"),
	expressContext = require("./scenarios/express-context")
	;

buster.spec.expose();

var rsc = utils.runSaveAndComplete;

describe("Given app, adapter and copy sets config", function() {

	before(function() {
		utils.GivenRepoAndConfig.call(this, "simple-copying");
		this.app = new expressContext.App(3456);
		this.rootUrl = "/rootUrl";
		var expressConfig = this.config.express || {};
		expressConfig.root = this.rootUrl;
		this.adapter = new expressadapter.Adapter(this.sets, expressConfig);
		this.adapter.install(this.app);
	});

	after(function() {
		this.app.dispose();
	});
	
	describe("When POST /rootUrl/forms is requested as JSON", function() {

		before(function(done) {
			this.originalData = "hello world " + Math.random();
			rsc(this, "postFormsResult", done, this.app.trigger, "POST", "/rootUrl/forms", "application/json", this.originalData, "text/plain");
		});

		it("it should contain a copy link", function() {
			var link = utils.findLinkByRel(this.json.links, "copy-to-publishedForms");
			expect(link).toBeTruthy();
		});

		describe("and then a GET of the copy link as JSON is requested", function() {

			before(function(done) {
				var copyURL = utils.findLinkByRel(this.json.links, "copy-to-publishedForms").href;
				rsc(this, "getCopyFormResult", done, this.app.trigger, "GET", copyURL, "application/json");
			});

			it("it should return a link to complete the copy", function() {
				var link = utils.findLinkByRel(this.json.links, "create");
				expect(link).toBeTruthy();
			});

			describe("and then a POST of the complete link as JSON is requested", function() {

				before(function(done) {
					var completeURL = utils.findLinkByRel(this.json.links, "create").href;
					rsc(this, "createCopyResult", done, this.app.trigger, "POST", completeURL, "application/json", this.json.data, "text/plain");
				});

				it("it should return created 201", function() {
					expect(this.createCopyResult[0].statusCode).toEqual(201);
				});

				it("it should contain a self link", function() {
					var link = utils.findLinkByRel(this.json.links, "self");
					expect(link).toBeTruthy();
				});

				describe("and the self link of the created member is followed", function() {

					before(function(done) {
						this.createdSelfURL = utils.findLinkByRel(this.json.links, "self").href;
						rsc(this, "createdSelfResult", done, this.app.trigger, "GET", this.createdSelfURL, "application/json");
					});

					it("it should contain the same data as original item", function() {
						expect(this.json.data).toEqual(this.originalData);
					});

					it("it should contain a set link to publishedForms", function() {
						var link = utils.findLinkByRel(this.json.links, "set");
						expect(link).toBeTruthy();
						expect(link.href).toMatch("publishedForms");
					});

					describe("and when the set link is followed", function() {

						before(function(done) {
							var link = utils.findLinkByRel(this.json.links, "set").href;
							rsc(this, "createdSelfSetResult", done, this.app.trigger, "GET", link, "application/json");
						});

						it("it should contain a link to the copied item", function() {
							var onlyItemLink = utils.findLinkByRel(this.json.links, "item");
							expect(onlyItemLink.href).toEqual(this.createdSelfURL);
						});
						
					});

				});

			});

		});

	});

});
