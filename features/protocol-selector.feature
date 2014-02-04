Feature: Coordinator
	As a user of hyperset
	I want to be able to attach a protocol-selector to my web server
	So that it can determine which protocol component should process the reuqest

Background: protocol-selector and configuration exists
	Given a protocol configuration
	And a protocolMapping configuration
	And a stub application
	And a protocol-selector attached to the application

Scenario: Given html content-type, protocol selector should create an HTML internal request
	Given the request has an accept header of "text/html"
	When the stub application receives the request
	Then it should create an internal request
	And the internal request type should be "html"
