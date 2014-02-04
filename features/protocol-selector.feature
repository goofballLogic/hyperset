Feature: Coordinator
	As a user of hyperset
	I want to be able to attach a protocol-selector to my web server
	So that it can determine which protocol component should process the reuqest

Background: protocol-selector and configuration exists
	Given a protocol configuration
	And a protocolMapping configuration
		| [ "foobar", "vnd.foo.bar/.*" ] |
	And a stub application
	And a protocol-selector attached to the application

Scenario: With no content type or accept header, the protocol selector should create an HTML internal request
	When the stub application receives the request
	Then it should create an internal request
	And the internal request type should be "html"

Scenario: Given stupid accept header including a json type, protocol selector should create a JSON internal request
	Given the request has an accept header of "image/jpeg, vnd.marni/foo.bar, application/json"
	When the stub application receives the request
	Then the internal request type should be "json"

Scenario: Given a request preferring one protocol to another, should create the right internal request
	Given the request has an accept header of "application/json, text/html"
	When the stub application receives the request
	Then the internal request type should be "json"

Scenario: Configuration of an unusual mapping to the json protocol
	Given the request has an accept header of "vnd.foo.bar/bzz"
	When the stub application receives the request
	Then the internal request type should be "foobar"
