all = test auto-test

.PHONY: $(all)

test:
	./node_modules/.bin/buster-test --reporter specification

auto-test:
	./node_modules/.bin/buster-autotest --reporter specification

sublime-test:
	./node_modules/.bin/buster-test --reporter tap