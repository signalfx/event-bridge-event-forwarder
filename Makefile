clean:
	rm -f event-bridge-event-forwarder.zip

zip:
	git rev-parse HEAD > commit-id.txt
	zip -r event-bridge-event-forwarder.zip index.mjs src commit-id.txt
