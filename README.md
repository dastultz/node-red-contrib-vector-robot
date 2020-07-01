# node-red-contrib-vector-robot

A Node-Red SDK for the Anki Vector Robot

Vector is a home robot developed by Anki and taken over by Digital Dream Labs. The official SDK is in Python.
I do not favor JavaScript over Python (or vice-versa), however I really wanted something that would integrate
with Node Red. This is the beginning of a JavaScript SDK. It is not intended to be scripted in JavaScript
but there's no reason you can't do that. It is designed to be run from Node Red.

Presently there are 9 nodes for some basic behavior and event monitoring. Using Node Red it is super easy
to hook up the event stream to a browser-based UI graphing battery voltage over time, for example. I have
connected my home automation system. Vector just told me it's getting late and my garage door is still open.

I had hoped to make this a great thing, but I have decided it's too much work for me to take on
so I offer this to the community with the hopes someone will run with it.

Presently I am struggling with "longevity". I have a Linux server in the house running Node Red.
There is no problem with Node Red running 24x7, but the connection(s) to Vector tend to fail
after some time, and a number of different attempts to reconnect have not proven fruitful.
I have found that the same happens with the official SDK in Python, so it may be a general
problem with Vector or I'm doing the same thing wrong with both models. It would be great if someone who understands the underlying gRPC protocol better could get this working more robustly.
