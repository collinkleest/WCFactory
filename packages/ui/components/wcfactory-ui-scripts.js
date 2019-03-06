import { LitElement, html } from 'lit-element';
import gql from 'graphql-tag'
import client from '../client.js'

const SUBSCRIBE_OPERATIONS_UPDATE = gql`
  subscription {
    operationsUpdate
  }
`

const SUBSCRIBE_OPERATIONS_OUTPUT = gql`
  subscription {
    operationsOutput
  }
`

const GET_OPERATIONS = gql`
  query {
    operations {
      script
      location
      pid
    }
  }
`

const GET_OPERATIONS_OUTPUT = gql`
  query {
    operationsOutput {
      output
      operation {
        pid
      }
    }
  }
`

const subscribeToOperations = () => {
  client.subscribe({
    query: SUBSCRIBE_OPERATIONS_UPDATE
  }).subscribe(({ data: { operationsUpdate } }) => {
    const data = client.readQuery({ query: GET_OPERATIONS })
    const operation = JSON.parse(operationsUpdate)
    data.operations = [...data.operations, operation]
    client.writeQuery({ query: GET_OPERATIONS, data })
  })
}

const subscribeToOperationsOutput = () => {
  client.subscribe({
    query: SUBSCRIBE_OPERATIONS_OUTPUT
  }).subscribe(({ data: { operationsOutput } }) => {
    const data = client.readQuery({ query: GET_OPERATIONS_OUTPUT })
    // grab a listing of all operations so we can dynaimcally
    const operationsCache = client.readQuery({ query: GET_OPERATIONS })
    // grab the operationOutput cache
    let operationsOutputData = JSON.parse(operationsOutput)
    // get the operation object reference
    const operationRef = operationsCache.operations.find(i => i.pid === operationsOutputData.operation)
    // create a new operationsOutputData with the operation object
    operationsOutputData = Object.assign({}, operationsOutputData, { operation: operationRef })
    // create a new instance of the cache
    data.operationsOutput = [...data.operationsOutput, operationsOutputData]
    // write the new cache back to the global cache
    client.writeQuery({ query: GET_OPERATIONS_OUTPUT, data })
  })
}

// start subscriptions
subscribeToOperations()
subscribeToOperationsOutput()

class WCFactoryUIScripts extends LitElement {
  static get properties() {
    return {
      scripts: { type: Array },
      operations: { type: Array },
      operationsOutput: { type: Array },
      location: { type: Array },
      activeScript: { type: String },
    }
  }

  constructor() {
    super()
    this.scripts = {}
    this.operations = []
    this.operationsOutput = []
    this.activeScript = ''
  }

  firstUpdated() {
    // fetch operations
    this.fetchOperations()
    // fetch operations output
    this.fetchOperationsOutput()
  }

  render() {
    return html`
      <style>
        button {
          font-family: inherit;
          border: none;
          margin: 0;
          padding: 0;
          background: none;
          color: inherit;
          cursor: pointer
        }
        .script {
          margin-right: 10px;
          padding: 5px;
        }

        .script[active="true"] {
          background: black;
        }

        #output {
          background: black;
          height: 100px;
          overflow-x: hidden;
          overflow-y: scroll;
          font-size: 10px;
        }
      </style>
        ${this.activeScript}
        ${this.script}
        ${this.scripts.map(script => {
          const currentOperation = this.operations.find(i => (i.script === script && i.location === this.location))
          const currentOperationOutput = (typeof currentOperation !== 'undefined') ? this.operationsOutput.filter(i => i.operation.pid === currentOperation.pid) : []
          if (currentOperation) {
            return html`
              <span
                class="script"
                active=${(this.activeScript === script)}> 🔄${script} </span>
              <div id="output">
                ${currentOperationOutput.map(o => html`${o.output} <br/>`)}
              </div>
            `
          }
          else {
            return html`
              <button
                class="script"
                @click=${e => this.runScript(script, this.location)}> 🚀${script} </button>`
          }
        })}
    `
  }

  async runScript(script, location) {
    try {
      await client.mutate({
        mutation: gql`
          mutation($script: String!, $location: String!) {
            runScript(script: $script, location: $location)
          }
        `,
        variables: { script, location }
      })
    } catch (error) {}
  }

  fetchOperationsOutput() {
    try {
      client.watchQuery({
        query: GET_OPERATIONS_OUTPUT,
      }).subscribe(({ data: { operationsOutput } }) => {
        this.operationsOutput = operationsOutput
      })
    } catch (error) {
    }
  }

  fetchOperations() {
    try {
      client.watchQuery({
        query: GET_OPERATIONS,
      }).subscribe(({ data: { operations } }) => {
        this.operations = operations
      })
    } catch (error) {
    }
  }
}

customElements.define('wcfactory-ui-scripts', WCFactoryUIScripts);
