all = test auto-test

.PHONY: $(all)

test:
	buster test --reporter specification

auto-test:
	buster autotest --reporter specification

sublime-test:
	buster test --reporter dots