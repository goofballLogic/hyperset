all = test auto-test sublime-test riak-test express-test

.PHONY: $(all)

test:
	./node_modules/.bin/buster-test

test-dot:
	./node_modules/.bin/buster-test
	
auto-test:
	./node_modules/.bin/buster-autotest --reporter specification

sublime-test:
#	./node_modules/.bin/buster-test --reporter specification -g "main" --color=none
	./node_modules/.bin/buster-test -g "main" --color=none

riak-test:
#	./node_modules/.bin/buster-test --reporter specification -g "riak" --color=none
	./node_modules/.bin/buster-test -g "riak" --color=none

express-test:
#	./node_modules/.bin/buster-test --reporter specification -g "express" --color=none
	./node_modules/.bin/buster-autotest -g "express" --color=none