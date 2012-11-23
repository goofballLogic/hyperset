var hyperset = require("../lib/hyperset"),
	repo = require("./utils/test-repo"),
	testServer = require("./utils/test-server"),
	buster = require("buster")
	;

var SUT = new hyperset.Set(repo);

buster.spec.expose();

describe("Given script and populated set,", function() {

	before(function() {
		repo.flush();
		this.script = require("./scenarios/simple");
		this.server = new testServer.Server();
		SUT.initialise(this.script, this.server.build);

		this.setName = this.script.sets[0].name;
		this.item = { "jello" : "world" };
		this.postResult = this.server[this.setName]["post-item"](this.item);
	});

	describe("When the item is PUT", function() {

		before(function() {
			var updated = this.updated = this.postResult.data.item;
			updated["jessie"] = "imran";
			this.putResult = this.server[this.setName]["put-item"]({ "id" : this.postResult.data.id }, updated);
		});

		it("it should say ok", function() {
			expect(this.putResult.statusCode).toEqual(200);
		});

		it("it should return the updated item", function() {
			expect(this.putResult.data.item["jessie"]).toEqual("imran");
			expect(this.putResult.data.item).toMatch(this.updated);
		});

		describe("and it is read again", function() {

			before(function() {
				this.getResult = this.server[this.setName]["get-item"]({ "id" : this.putResult.data.id });
			});

			it("it should be the same as the updated version", function() {
				expect(this.getResult.data).toMatch(this.putResult.data);
			});

		});

		describe("and the item is DELETEd", function() {

			before(function() {
				this.deleteResult = this.server[this.setName]["delete-item"]({ "id" : this.putResult.data.id });
			});

			it("it should say ok", function() {
				expect(this.deleteResult.statusCode).toEqual(200);
			});

			it("it should return the deleted item", function() {
				expect(this.deleteResult.data).toMatch(this.putResult.data);
			});

			describe("and when it is read again", function() {

				before(function() {
					this.getDeletedResult = this.server[this.setName]["get-item"]({ "id" : this.putResult.data.id });
				});

				it("it should return nothing", function() {
					expect(this.getDeletedResult.statusCode).toEqual(404);
				});

			});

		});

	});

});