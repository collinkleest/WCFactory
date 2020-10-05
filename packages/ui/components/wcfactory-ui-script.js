import { html, ApolloQuery } from 'lit-apollo';
import gql from 'graphql-tag'
import client from '../client.js'
import 'lit-apollo/elements/apollo-mutation-element.js';
import './wcfactory-ui-script-run.js'
import './wcfactory-ui-script-stop.js'

export const GET_OPERATIONS = gql`
  query operationsList {
    operations {
      id
      location
      script
      pid
      element {
        id
        name
      }
    }
  }
`

class WCFactoryUIScript extends ApolloQuery {
  static get properties() {
    return {
      script: { type: String },
      location: { type: String }
    }
  }

  constructor() {
    super()
    this.client = client
    this.query = GET_OPERATIONS
  }

  render() {
    // set up the mutation
    const { data } = this
    const active = (data.operations.find(i => i.script === this.script && i.location === this.location)) ? true : false
    if (active) {
      return html`
        <wcfactory-ui-script-stop .script=${this.script} .location=${this.location}>${this.script}</wcfactory-ui-script-stop>
      `
    }
    else {
      return html`
        <wcfactory-ui-script-run .script=${this.script} .location=${this.location}></wcfactory-ui-script-run>
      `
    }
  }
}

customElements.define('wcfactory-ui-script', WCFactoryUIScript);