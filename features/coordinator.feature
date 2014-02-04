Feature: Coordinator
	As a user of hyperset
	I want to be able to attach a coordinator to my web server
	So that it can process requests and respond with the help of the dispatchers

Background: coordinator and configuration exists
	Given a stub policy dispatcher
	And a stub response dispatcher
	And a stub request dispatcher
	And an attached coordinator

Scenario: Configures the dispatchers
	Then the request dispatcher should be correctly configured

Scenario: Coordinator does not receive an internal request attached to the request
	When the coordinator receives a request without an internal request
	Then it should call next with an error

Scenario: Dispatches an internal request
	Given the stub request-dispatcher will return a response of
		| { "text" : "fake response" } |
	When the coordinator receives a request
		| { "collectionName": "users", "id": "1234" } |
	Then the policy-dispatcher should receive the request to dispatch
		| { "collectionName": "users", "id": "1234" } |
	And the request-dispatcher should receive the request to dispatch
		| { "collectionName": "users", "id": "1234" } |
	And the response object after coordinator is finished should include
		| { "text" : "fake response" } |

Scenario: Policy pre-empts request dispatch
	Given the stub policy dispatcher will pre-empt request evaluation with a response
		| { "code" : 302, "message" : "Over there!", "headers" : { "Location" : "http://go.there" }, "text": "SEP field" } |
	When the coordinator receives a request
		| { "more" : "please" } |
	Then the request-dispatcher should not receive a request
	And the response object after coordinator is finished should include
		| { "code" : 302, "message" : "Over there!", "headers" : { "Location" : "http://go.there" }, "text": "SEP field" } |

Scenario: An error during policy evaluation pre-empts request dispatch
	Given the stub policy dispatcher will respond with an error
		| uh oh |
	When the coordinator receives a request
		| { "more" : "please" } |
	Then the request-dispatcher should not receive a request
	And the response object after coordinator is finished should include
		| { "code" : 500, "message" : "uh oh" } |

Scenario: An error during request dispatch should result in an error response
	Given the stub request dispatcher will respond with an error
		| uh oh |
	When the coordinator receives a request
		| { "more" : "please" } |
	And the response object after coordinator is finished should include
		| { "code" : 500, "message" : "uh oh" } |