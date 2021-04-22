/* exported createPaymentCredential */
/* exported onBuyClicked */

const textEncoder = new TextEncoder();

/**
 * Creates a payment credential.
 */
async function createPaymentCredential(windowLocalStorageIdentifier) {
  const rp = {
    id: 'lightrains.org',
    name: 'Rouslan Solomakhin',
  };
  const instrument = {
    displayName: 'Troy\r\n\r\n\r\n\t\t\t\t\t\u0085\u0085\u0085\u0085\u0085\u2028\u2028\u2028\u2028\u2028\u2028\u2028\t\r\n\r\n\r\n\r\nddddd',
    icon: 'https://abc.xyz/img/g-icon.jpg',
  };
  const pubKeyCredParams = [
  {
        "type": "public-key",
        "alg": -7
      },
      {
        "type": "public-key",
        "alg": -35
      },
      {
        "type": "public-key",
        "alg": -36
      },
      {
        "type": "public-key",
        "alg": -257
      },
      {
        "type": "public-key",
        "alg": -258
      },
      {
        "type": "public-key",
        "alg": -259
      },
      {
        "type": "public-key",
        "alg": -37
      },
      {
        "type": "public-key",
        "alg": -38
      },
      {
        "type": "public-key",
        "alg": -39
      },
      {
        "type": "public-key",
        "alg": -8
      }];
  const authenticatorSelection = {
      authenticatorAttachment: "cross-platform"
  };
  const payment = {
    rp,
    instrument,
    challenge: textEncoder.encode('Transaction approval challenge'),
    pubKeyCredParams,
    authenticatorSelection,
  };
  try {
    const pkc = await navigator.credentials.create({payment});
    console.log(pkc);
    window.localStorage.setItem(
        windowLocalStorageIdentifier,
        btoa(String.fromCharCode(...new Uint8Array(
            pkc.rawId))));
    console.log(windowLocalStorageIdentifier + ': Credential ' +
         window.localStorage.getItem(windowLocalStorageIdentifier) +
         ' enrolled.');
  } catch (err) {
    console.log(err);
  }
}

/**
 * Initializes the payment request object.
 * @return {PaymentRequest} The payment request object.
 */
async function buildPaymentRequest(windowLocalStorageIdentifier) {
  if (!window.PaymentRequest) {
    return null;
  }

  let request = null;

  try {
    // Documentation:
    // https://github.com/rsolomakhin/secure-payment-confirmation
    const supportedInstruments = [{
      supportedMethods: 'secure-payment-confirmation',
      data: {
        action: 'authenticate',
        credentialIds: [Uint8Array.from(
            atob(window.localStorage.getItem(windowLocalStorageIdentifier)),
            c => c.charCodeAt(0))],
        networkData: textEncoder.encode('network_data'),
        timeout: 60000,
        fallbackUrl: 'https://lightrains.org/pr/spc/fallback'
      },
    }];

    const details = {
      total: {
        label: 'Total',
        amount: {
          currency: 'USD\r\n\r\nddd',
          value: '0.01\r\n\r\nddd',
        },
      },
    };

    request = new PaymentRequest(supportedInstruments, details);
  } catch (err) {
    console.log(err);
  }

  return request;
}

/**
 * Launches payment request for Android Pay.
 */
async function onBuyClicked(windowLocalStorageIdentifier) {
  if (!window.PaymentRequest) {
    console.log('PaymentRequest API is not supported.');
    return;
  }

  const request = await buildPaymentRequest(windowLocalStorageIdentifier);
  if (!request)
    return;

  try {
    const instrumentResponse = await request.show();
    await instrumentResponse.complete('success')
    console.log(windowLocalStorageIdentifier + ': ' + JSON.stringify(instrumentResponse, undefined, 2));
  } catch (err) {
    console.log(err);
  }
}

async function checkCanMakePayment(windowLocalStorageIdentifier) {
  if (!window.PaymentRequest) {
    console.log('PaymentRequest API is not supported.');
    return;
  }
  try {
    const request = await buildPaymentRequest(windowLocalStorageIdentifier);
    if (!request)
      return;
    const result = await request.canMakePayment();
    console.log(windowLocalStorageIdentifier + ': ' + (result ? 'Can make payment.' : 'Cannot make payment'));
  } catch (err) {
    console.log(err);
  }
}
