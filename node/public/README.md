# Biternet Node Web Portal
This is the captive portal that each node will host when client service is enable on the node.
The captive portal features a stateless (would like it to be stateful EVENTUALLY) captive portal which sets up a payment channel, facillitates the funding of a temporary wallet on the web application exposed to the user and processes automated payments to the server when invoice is received from the Biternet Node. Seperation of concerns guarantees that the Private Keys used for PaymentTxs on client-side never gets leaked to the Biternet Node. 

## Technologies Used
- Webpack
- React.js
- React-bootstrap
- Bootstrap
- socket.io-client

## Eventual Inclusions
- Support for Payment Protocol where Biternet Node will apply state change to Web Client and notify the web client of commitmentTx.
- Support for Cookies to store state of the Client. (At the mean time, if you exit the client/browser, all state is lost but you
  will still get your bitcoins back.)

## Comments/Feedbacks
All comments and feedbacks welcomed :)
