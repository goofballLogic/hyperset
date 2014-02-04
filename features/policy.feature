Feature: Coordinator
	As a user of hyperset
	I want to be able to start the hyperset protocol with appropriate configuration
	So that it can accept incoming requests and establish the correct http interactions

Background: configuration and an express app
	Given configuration with appUrl of "http://localhost:9999/api"
	And configuration with application name of "goofballLogic"
	And an express application on port "9999"

Scenario: Should provide the correct static URLs for http interaction
	When the protocol is instantiated
	And a request is received by the application
		| get | http://localhost:9999/api |
	Then it should have a hyperset "name" of "goofballLogic"
	And it should have a hyperset "appUrl" of "http://localhost:9999/api"
	And it should have a hyperset "addCollectionUrl" of "http://localhost:9999/api"
	And it should have a hyperset "collectionUrlTemplate" of "http://localhost:9999/api/c/{{collectionName}}"

Scenario: Should enable building a collection url
	When the protocol is instantiated
	And a request is received by the application
		| get | http://localhost:9999/api |
	Then the hyperset "getCollectionUrl" function should return "http://localhost:9999/api/c/users" when called with
		| users |

Scenario: Should enable building a delete collection request url
	When the protocol is instantiated
	And a request is received by the application
		| get | http://localhost:9999/api |
	Then the hyperset "getDeleteCollectionRequestUrl" function should return "http://localhost:9999/api/c/users/deleterequests" when called with
		| users |

Scenario: Should enable building an item url template
	When the protocol is instantiated
	And a request is received by the application
		| get | http://localhost:9999/api |
	Then the hyperset "getItemUrlTemplate" function should return "http://localhost:9999/api/c/users/i/{{itemId}}" when called with
		| users |

Scenario: Should enable building an item url
	When the protocol is instantiated
	And a request is received by the application
		| get | http://localhost:9999/api |
	Then the hyperset "getItemUrl" function should return "http://localhost:9999/api/c/users/i/joe" when called with
		| users | joe |

Scenario: Should enable building an upsert item url
	When the protocol is instantiated
	And a request is received by the application
		| get | http://localhost:9999/api |
	Then the hyperset "getUpsertItemUrl" function should return "http://localhost:9999/api/c/users/upserts/joe" when called with
		| users | joe |







