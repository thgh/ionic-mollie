const functions = require('firebase-functions')

const MOLLIE_API_KEY = 'test_PT8Vn...'

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

const firebaseMock = []

exports.createPayment = functions.https.onRequest(async (req, res) => {
  const { amount, userId } = req.query
  console.log('userId', userId)
  console.log('amount', amount, parseFloat(amount))
  // Create payment
  try {
    const payment = await postJSON('https://api.mollie.com/v2/payments', {
      amount: {
        currency: 'EUR',
        value: parseFloat(amount).toFixed(2)
      },
      description: 'coupon solutions',
      method: 'bancontact',
      redirectUrl: 'coupon://payment?amount=' + amount,
      webhookUrl: 'https://us-central1-coupon-6de23.cloudfunctions.net/webhook'
    })

    // Save payment id in firebase
    // firebase.store({ payment, userId })
    firebaseMock.push({ payment, userId })

    res.set('Access-Control-Allow-Origin', '*')
    res.send(JSON.stringify(payment))
  } catch (e) {
    res.set('Access-Control-Allow-Origin', '*')
    res.send(
      JSON.stringify({
        _links: {
          checkout: {
            href: 'https://coupon.glitch.me'
          }
        }
      })
    )
  }
})

exports.listPayments = functions.https.onRequest(async (req, res) => {
  const { userId } = req.query

  // Get all payments of a user
  // firebase.getall({ payment, userId })
  const payments = firebaseMock.filter(tx => tx.userId === userId)

  res.set('Access-Control-Allow-Origin', '*')
  res.send(JSON.stringify(payments))
})

exports.webhook = functions.https.onRequest(async (req, res) => {
  const { id } = req.body

  // Create payment
  try {
    const payment = getJSON(
      `https://api.mollie.com/v2/payments/${id}?testmode=1`
    )

    // Update payment status in firebase
    // firebase.store({ payment, userId })
    const exists = firebaseMock.find(tx => tx.payment.id === payment.id)
    if (exists) {
      exists.payment = payment

      if (payment.status === 'paid') {
        console.log('notify user that it is paid')
      }
    }

    res.send('ok')
  } catch (e) {
    res.send('not ok')
  }
})

function getJSON(url, json, options) {
  options = options || {}
  options.method = 'GET'
  return fetchJSON(url, options)
}

function postJSON(url, json, options) {
  options = options || {}
  options.json = json
  options.method = 'POST'
  return fetchJSON(url, options)
}

function fetchJSON(url, options) {
  if (options.json) {
    options.body = JSON.stringify(options.json)
  }
  if (!global.fetch) {
    global.fetch = require('node-fetch')
  }
  return fetch(
    url,
    Object.assign(
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          authorization: 'Bearer ' + MOLLIE_API_KEY,
          accept: 'application/json',
          'content-type': 'application/json'
        }
      },
      options
    )
  ).then(r => r.json())
}
