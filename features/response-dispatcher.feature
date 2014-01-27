Feature: Response dispatcher
	As a user of hyperset
	I want responses to be appropriate for the request received
	So that hyperset can service clients of varying capabilities in ways which honour the configured intent of the hyperset application

Scenario: By default, an incoming JSON request should result in the default JSON renderer
	Given an internal request with type "application/json"
	And a response dispatcher is instantiated
	And an internal response on the request of
		| { "item" : { "id": 1, "content" : { "the" : "item" } } } |
	When the response-dispatcher receives the internal request
	Then it should set the item-type to "item"
	And it should dispatch the response to the JSON renderer

Scenario: If configured with an alternative JSON renderer, it should use that instead of the default
	Given an internal request with type "application/json"
	And a stub renderer is configured named "json"
	And a response dispatcher is instantiated
	And an internal response on the request of
		| { "item" : { "id": 1, "content" : { "the" : "item" } } } |
	When the response-dispatcher receives the internal request
	Then it should dispatch the response to the stub renderer

Scenario: Map/re-map an input type to a chosen renderer
	Given an internal request with type "text/html"
	And a rendererMapping configuration
		| ^.*html$ | json |
	And a response dispatcher is instantiated
	And an internal response on the request of
		| { "item": { "the" : "item" } } |
	When the response-dispatcher receives the internal request
	Then it should dispatch the response to the JSON renderer

Scenario: An error should become an error render type
	Given a response dispatcher is instantiated
	And an internal response on the request of
		| { "err" : "Something went terribly wrong" } |
	And a response dispatcher is instantiated
	When the response-dispatcher receives the internal request
	Then it should set the item-type to "error"

Scenario: status code and output should be sent to the response
	Given an internal request with type "application/vnd.hyperset.item+json"
	And a stub renderer is configured named "json"
	And a response dispatcher is instantiated
	And the stub renderer will respond with status code and content
		| 200 |	{ "yo" : "momma" } |
	And an internal response on the request of
		| { "item" : { "id": 1, "content" : { "the" : "item" } } } |
	When the response-dispatcher receives the internal request
	Then it should send a response with status code and content
		| 200 |	{ "yo" : "momma" } |
