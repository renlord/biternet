const React       = require('react')
const QRCode      = require('qrcode-js')
const bitcoin     = require('bitcoinjs-lib')
const bs58check   = require('bs58check')
const request     = require('browser-request')

const WebClient   = require('./webclient')()

/** REACT BOOTSTRAP IMPORTS **/
const Input       = require('react-bootstrap/lib/Input')
const Button      = require('react-bootstrap/lib/Button')
const ButtonInput = require('react-bootstrap/lib/ButtonInput')
const Modal       = require('react-bootstrap/lib/Modal')
const Jumbotron   = require('react-bootstrap/lib/Jumbotron')

var Advertisement = React.createClass({
  // button - AGREE ToS
  getInitialState: function() {
    return {
      showModal : false,
      refundAddress : '',
      disallowConfirm : true,
      refundValid : "warning"
    }
  },
  close: function() {
    this.setState({ showModal: false })
  },
  open: function() {
    this.setState({ showModal: true })
  },
  componentDidMount: function() {
    request('http://192.168.10.1:6164/advertisement', function(err, res, body) {
      console.log(body)
      var obj = JSON.parse(body)
      WebClient.paymentDetails = {
        serverPubKey: obj.serverPubKey,
        paymentAddress: obj.paymentAddress
      }
      if (this.isMounted()) {
        this.setState({
          deposit : obj.minDeposit,
          pricePerKB: obj.pricePerKB,
          chargeInterval: obj.chargeInterval,
          timelockDuration: obj.minTimeLockDuration,
          threshold: obj.warningAmountThreshold
        })
      }
    }.bind(this));
  },
  componentWillUnmount: function() {
    WebClient.socket.removeListener('TOS')
  },
  refundValidationState: function(state) {
    let addr = this.refs.input.getValue()
    try {
      bs58check.decode(addr)
    } catch(err) {
      this.setState({ 
        refundValid : "error",
        disallowConfirm : true
      })
      return;
    }
    this.setState({ 
      refundValid : "success",
      disallowConfirm : false
    })
    return;
  },
  refundChange: function() {
    this.refundValidationState()
    this.setState({ refundAddress: this.refs.input.getValue() })
  },
  startChannel: function() {
    // starts channel with server after clicking agree TOS
    WebClient.startChannel()
    this.props.nextState("balance")
  },
  cancelChannel: function() {
    this.props.nextState("welcome")
  },  
  render: function() {
    var btcaddressqr = QRCode.toDataURL("bitcoin:" + WebClient.getFundingAddress(), 4);
    return (
      <div>
        <h4> Usage Agreement </h4> 
        <form>
          <fieldset disabled>
            <Input type="text" label="Min. Deposit" value={this.state.deposit}/>
            <Input type="text" label="Price Per KB" value={this.state.pricePerKB}/>
            <Input type="text" label="Invoicing Interval" value={this.state.chargeInterval}/>
            <Input type="text" label="Timelock Duration" value={this.state.timelockDuration}/>
            <Input type="text" label="Min. Threshold" value={this.state.threshold}/>
          </fieldset>
          <p>
            <Button bsStyle="primary" onClick={this.open}>Agree</Button>&nbsp;
            <Button bsStyle="danger" onClick={this.cancelChannel}>Disagree</Button>
          </p>
          <Modal show={this.state.showModal} onHide={this.close}>
            <Modal.Header closeButton>
              <Modal.Title> Funding Procedures </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h4> Step 1. Please fill out refund details </h4>
              <form>
                <Input 
                  type="text" 
                  label="Refund Address" 
                  value={this.state.refundAddress} 
                  placeholder="Enter Refund Address"
                  bsStyle={this.state.refundValid}
                  ref="input"
                  onChange={this.refundChange}
                  hasFeedback
                />
              </form>
              <hr/>
              
              <h4> Step 2. Please fund temporary wallet </h4>
              <div className="col-sm-12 col-md-4" max-height="" id="qrcode">
                <img src={btcaddressqr}/>
              </div>
              <hr/>

              <h4> Step 3. Please record wallet WIF for recovery </h4>
              <div className="well"> {WebClient.getWIF()} </div>
            </Modal.Body>
            <Modal.Footer>
              <Button bsStyle="primary" onClick={this.startChannel} disabled={this.state.disallowConfirm}> Confirm </Button>
              <Button bsStyle="danger" onClick={this.close}> Cancel </Button>
            </Modal.Footer>
          </Modal>
        </form>
      </div>
    );
  }
});

var Balance = React.createClass({
  endService: function() {
    WebClient.closeChannel()
    this.props.nextState("thankyou")
  },
  componentDidMount: function() {

  },
  componentWillUnmount: function() {
        
  },
  render: function() {
    return (
      <div>
      <h4> Usage Meter </h4>
      <form>
        <fieldset disabled>
          <Input type="text" label="Balance (bits)" value={this.props.balance}/>
          <Input type="text" label="Satoshi/KB" value={this.props.pricePerKB}/>
          <Input type="text" label="Usage (KB)" value={this.props.usage}/>
          <Input type="text" label="Usage Time" value={this.props.usageTime}/>
          <Input type="text" label="Payment Sum (bits)" value={this.props.paymentSum}/>
        </fieldset>
        <ButtonInput onClick={this.endService}> End Service </ButtonInput>
      </form>
      </div>
    )
  }
});

var NetworkStatus = React.createClass({
  getInitialState: function() {
    return {
      hasNetwork : false
    }
  },
  componentDidMount: function() {
    var self = this
    WebClient.socket.on('WAN', function(msg) {
      self.setState({ hasNetwork : msg.state })
    })

    WebClient.socket.on('disconnect', function() {
      self.setState({ hasNetwork : false })
    })

    WebClient.socket.on('connect', function() {
      WebClient.socket.emit('WAN')
    })
  },
  componentWillUnmount: function() {
    WebClient.socket.removeListener('WAN')
    WebClient.socket.removeListener('disconnect')
    WebClient.socket.removeListener('connect')
  },
  render: function() {
    var dom
    if (this.state.hasNetwork) {
      dom = ( 
        <div className="alert alert-success">
          <strong> Network Status: </strong>
          <div className="text-right pull-right">
            <strong> WAN Available </strong>
            <span className="glyphicon glyphicon-ok-sign" aria-hidden="true"></span>
          </div>
        </div>
      )
    } else {
      dom = (
        <div className="alert alert-danger">
          <strong> Network Status: </strong>
          <div className="text-right pull-right">
            <strong> No WAN Access </strong>
            <span className="glyphicon glyphicon-remove-sign" aria-hidden="true"></span>
          </div>
        </div>
      )
    }
    return (
      (dom)
    )
  }
});

var ThankYou = React.createClass({
  nextState: function() {
    this.props.nextState("welcome")
  },
  render: function() {
    return (
      <div>
      <h4> Thank you for using Biternet </h4>
      <form>
        <fieldset disabled>
          <Input type="text" label="Total Paid (bits)" value={this.props.paid} />
          <Input type="text" label="Total Usage (MB)" value={this.props.usage} />
          <Input type="text" label="PaymentTx ID" value={this.props.paymentTxId} />
          <Input type="text" label="RefundTx Hash" value={this.props.refundTxHash} />
        </fieldset>
        <Button bsStyle="success" onClick={this.nextState}> Done </Button>
      </form>
      </div>
    )
  }
})

var Welcome = React.createClass({
  nextState: function() {
    this.props.nextState("advertisement")
  },
  render: function() {
    return (
      <Jumbotron>
        <h1> Biternet Meshnet</h1>
        <p> Unshackle yourself from your ISP! <br/>Pay securely, anonymously and freely for Internet. </p>
        <p><Button bsStyle="primary" onClick={this.nextState}> Get Started </Button></p>
      </Jumbotron>
    );
  }
})

var Error = React.createClass({
  render: function() {
    return (
      <h4> State Transition Error. Unknown State! </h4>
    )
  }
})

// container for the UI
const containerTitle = (
  <h3> "Biternet Network Client Portal" </h3>
)

var MainContainer = React.createClass({
  getInitialState: function() {
    return {
      contentState: "welcome",
      hasNetwork: false
    }
  },
  nextState: function(state) {
    this.setState({ contentState: state })
  },
  render: function() {
    var main_content
    switch(this.state.contentState) {
      case "welcome":
        main_content = (
          <div>
            <Welcome nextState={this.nextState} />
          </div>
        )
        break
      case "advertisement":
        main_content = (
          <div>
            <Advertisement nextState={this.nextState} />
          </div>
        )
        break
      case "balance":
        main_content = (
          <div>
            <Balance nextState={this.nextState}/>
          </div>
        );
        break
      case "thankyou": 
        main_content = (
          <div>
            <ThankYou nextState={this.nextState} />
          </div>
        )
        break
      default:
        main_content = (
          <div>
            <Error />
          </div>
        )
        break
    }
    return (
      <div className="row">
        <div className="col-sm-12">
          <h3> Biternet Client Portal </h3>
          <hr/>
          <NetworkStatus/>
          {main_content}
        </div>
      </div>
    )
  }
})

module.exports = {
  MainContainer : MainContainer  
}