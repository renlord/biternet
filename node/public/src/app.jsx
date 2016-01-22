const React = require('react');
const QRCode = require('qrcode-js');
const bitcoin = require('bitcoinjs-lib');

const socket = require('socket.io-client')();

var biternetClientChannel = null;

const btcPrivateKey = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet });

/** REACT BOOTSTRAP IMPORTS **/
const Input       = require('react-bootstrap/lib/Input');
const Button      = require('react-bootstrap/lib/Button');
const ButtonInput = require('react-bootstrap/lib/ButtonInput');
const Modal       = require('react-bootstrap/lib/Modal');

var Advertisement = React.createClass({
  // button - AGREE ToS
  getInitialState: function() {
    return {
      showModal : false
    };
  },
  close: function() {
    this.setState({ showModal: false });
  },

  open: function() {
    this.setState({ showModal: true });
  },
  componentDidMount: function() {
    socket.on('biternet-advertisement', this.setAdvertisement);
    socket.on('biternet-cli-pp', this.close);
    socket.emit('biternet-advertisement');
  },
  componentWillUnmount: function() {
    socket.removeListener('biternet-advertisement');
    socket.removeListener('biternet-cli-pp');
  },
  setAdvertisement: function(ad) {
    this.props.deposit = ad.minDeposit;
    this.props.pricePerKB = ad.pricePerKB;
    this.props.chargeInterval = ad.chargeInterval;
    this.props.timelockDuration = ad.minTimeLockDuration;
    this.props.threshold = ad.warningAmountThreshold;
  },
  startChannel: function() {
    // starts channel with server after clicking agree TOS
  },
  render: function() {
    var btcaddressqr = QRCode.toDataURL("bitcoin:" + btcPrivateKey.getAddress());
    return (
      <form className="form-horizontal">
        <h4> Usage Agreement </h4> 
        <fieldset disabled>
          <Input type="text" label="Min. Deposit" labelClassName="col-xs-2" wrapperClassName="col-xs-10" value={this.props.deposit}/>
          <Input type="text" label="Price Per KB" labelClassName="col-xs-2" wrapperClassName="col-xs-10" value={this.props.pricePerKB}/>
          <Input type="text" label="Invoicing Interval" labelClassName="col-xs-2" wrapperClassName="col-xs-10" value={this.props.chargeInterval}/>
          <Input type="text" label="Timelock Duration" labelClassName="col-xs-2" wrapperClassName="col-xs-10" value={this.props.timelockDuration}/>
          <Input type="text" label="Min. Threshold" labelClassName="col-xs-2" wrapperClassName="col-xs-10" value={this.props.threshold}/>
        </fieldset>
        <ButtonInput onclick={this.startChannel}> Agree ToS </ButtonInput>
        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title> Funding Procedures </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4> Step 1. Please fill out refund details </h4>
            <form>
              <Input type="text" label="Refund Address" labelClassName="col-xs-2" wrapperClassName="col-xs-10" disabled={this.lockRefundAddress}/>
              <ButtonInput onclick={this.lockRefundAddress}> Confirm </ButtonInput>
            </form>
            <hr/>
            
            <h4> Step 2. Please fund temporary wallet </h4>
            <div id="qrcode"></div>
            <small> {btcPrivateKey.getAddress()} </small>
            <hr/>

            <h4> Step 3. Please record wallet WIF for recovery </h4>
            <div className="well"> {btcPrivateKey.toWIF()} </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close}> Done </Button>
          </Modal.Footer>
        </Modal>
      </form>
    );
  }
});

var Balance = React.createClass({
  componentDidMount: function() {
    socket.on('channel', function(msg) { 
      switch(type) {
        case 'invoice':

          break;

      }
    });
  },
  componentWillUnmount: function() {
    socket.removeListener('channel');
  },
  endService: function() {
    socket.emit('channel', { type: 'shutDown' });
    biternetChannel = null;
  },
  render: function() {
    return (
      <form className="form-horizontal">
        <fieldset disabled>
          <Input type="text" label="Balance (Satoshi)" labelClassName="col-xs-2" wrapperClassName="col-xs-10" value="this.props.balance"/>
          <Input type="text" label="Satoshi/KB" labelClassName="col-xs-2" wrapperClassName="col-xs-10" value="this.props.pricePerKB"/>
          <Input type="text" label="Usage (KB)" labelClassName="col-xs-2" wrapperClassName="col-xs-10" value="this.props.usage"/>
        </fieldset>
        <ButtonInput onClick="this.endService"> End Service </ButtonInput>
      </form>
    );
  }
});

var NetworkStatus = React.createClass({
  componentDidMount: function() {
    socket.on('biternet-network-status', this.setNetworkStatus);
    socket.emit('biternet-network-status');
  },
  componentWillUnmount: function() {
    socket.removeListener('biternet-network-status');
  },
  setNetworkStatus: function(msg) {
    this.props.networkState = msg.state;
  },
  render: function() {
    var dom;
    if (this.props.hasNetwork) {
      dom = ( 
        <div className="row">
          <div className="col-sm-12">
            <strong> Network Status: </strong>
            <span className="glyphicon glyphicon-ok-sign pull-right" aria-hidden="true"></span>
          </div>
        </div>
      );
    } else {
      dom = (
        <div className="row">
          <div className="col-sm-12">
            <strong> Network Status: </strong>
            <span className="glyphicon glyphicon-remove-sign pull-right" aria-hidden="true"></span>
          </div>
        </div>
      );
    }
    return (
      {dom}
    );
  }
});

// container for the UI
const containerTitle = (
  <h3> "Biternet Network Client Portal" </h3>
);

var MainContainer = React.createClass({
  getInitialState: function() {
    return {
      authState: false      
    };
  },
  componentDidMount: function() {
    // generate wallet private key
    
  },
  render: function() {
    var main_content;
    if(this.state.authState) {
      main_content = (
        <Balance />
      );
    } else {
      main_content = (
        <Advertisement />
      );
    }
    return (
      <div>
        <h3> Biternet Client Portal </h3>
        <hr/>
        {main_content}
      </div>
    );
  }
});

module.exports = {
  MainContainer : MainContainer  
}