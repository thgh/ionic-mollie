import { Component } from '@angular/core'
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx'

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  amount: number = 20
  pollDelay: number = 0
  payments: any = []

  constructor(private iab: InAppBrowser) {}

  get isBusy() {
     return this.payments.filter(p => ['open', 'pending'].includes(p.status)).length
  }

  async pay(a) {
    this.payments.push({status: 'open'})
    const response = await fetch(
      'https://us-central1-coupon-6de23.cloudfunctions.net/createPayment?amount=' + a
    ).then(r => r.json())
    if (!response._links || !response._links.checkout) {
      return alert('unexpected reponse, payment failed')
    }

    const browser = this.iab.create(response._links.checkout.href)

    setTimeout(this.checkPayments, 3000)
  }

  async checkPayments(a) {
    this.payments = await fetch(
      'https://us-central1-coupon-6de23.cloudfunctions.net/listPayments'
    ).then(r => r.json())

    // Keep checking if there is unresolved payments
    if (this.isBusy) {
      this.pollDelay += 1000
      setTimeout(this.checkPayments, this.pollDelay + 1000)
    } else {
      this.pollDelay = 0
    }
  }
}
