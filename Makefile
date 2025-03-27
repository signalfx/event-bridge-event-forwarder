clean:
	rm -f event-bridge-event-forwarder.zip

zip:
	rm -f event-bridge-event-forwarder.zip
	git rev-parse HEAD > commit-id.txt
	zip -r event-bridge-event-forwarder.zip src commit-id.txt
