require("buster").spec.expose();

describe("Given spec", function() {
	describe("When executed", function() {
		it("Should test the spec", function() {
			expect(true).toBeTrue();
		});
	});
});