Feature: Request dispatcher
	As a user of hyperset
	I want to be able to use any repo I fancy by configuration
	So that hyperset can be used in various environments without reworking it

Background: a repo exists, configuration exists, the dispatcher is instantiated
	Given stub repository configuration is supplied
	And a request-dispatcher has been instantiated
	And the stub repository has some collections
		| users    |
		| accounts |
	And the stub repository has some items
		| users | bob | "hello" |
		| users | jim | "world" |

Scenario: a simple view item request
	Given an internal request to view an item "bob" in collection "users"
	When the request is dispatched to the request-dispatcher
	Then the result should have a response containing
		| item | { "id" : "bob", "content" : "hello" } |

Scenario: a request to view items in the collection
	Given an internal request to view a collection "users"
	When the request is dispatched to the request-dispatcher
	Then the result should have a response containing
		| collection | { "name" : "users", "items" : [ "bob", "jim" ] } |

Scenario: a request to get an item or template (doesn't existing)
	Given an internal request to get an item or template with id "jimbo" in collection "users"
	When the request is dispatched to the request-dispatcher
	Then the result should have a response containing
		| itemOrTemplate | { "id" : "jimbo", "content" : null } |
		| isExistingItem | false                                |

Scenario: a request to get an item or template (does exist)
	Given an internal request to get an item or template with id "bob" in collection "users"
	When the request is dispatched to the request-dispatcher
	Then the result should have a response containing
		| itemOrTemplate | { "id" : "bob", "content" : "hello" } |
		| isExistingItem | true                                  |

Scenario: get application
	Given an internal request to view the application
	When the request is dispatched to the request-dispatcher
	Then the result should have a response containing an application object

Scenario: a request to get an item or template with no id
	Given an internal request to get an item or template with id "" in collection "users"
	When the request is dispatched to the request-dispatcher
	Then the result should have a response containing an item template

Scenario: add a collection
	Given an internal request to "add" a collection "shakes"
	When the request is dispatched to the request-dispatcher
	Then a collection "shakes" "should" exist in the stub repository

Scenario: delete a collection
	Given an internal request to "delete" a collection "users"
	When the request is dispatched to the request-dispatcher
	Then a collection "users" "shouldn't" exist in the stub repository

Scenario: insert a new item
	Given an internal request to "upsert" an item
		| users | felix | { "the" : "cat", "sat" : "on the mat" } |
	When the request is dispatched to the request-dispatcher
	Then an item "should" exist in the stub repository
		| users | felix | { "the" : "cat", "sat" : "on the mat" } |

Scenario: update an existing item
	Given an internal request to "upsert" an item
		| users | bob | { "new" : "stuff" } |
	When the request is dispatched to the request-dispatcher
	Then an item "should" exist in the stub repository
		| users | bob | { "new" : "stuff" } |

Scenario: delete an item
	Given an internal request to "delete" an item
		| users | bob |
	When the request is dispatched to the request-dispatcher
	Then an item "shouldn't" exist in the stub repository
		| users | bob |