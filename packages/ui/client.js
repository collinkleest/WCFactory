import { ApolloClient } from 'apollo-client';
import { InMemoryCache, defaultDataIdFromObject } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import { ApolloLink, split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { withClientState } from 'apollo-link-state';
import { RetryLink } from "apollo-link-retry";

// Create an http link:
const httpLink = new HttpLink({
  uri: `http://localhost:4000`,
})

// Create a Websocket link;
const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: {
    reconnect: true
  }
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const httpWsLink = split(
  // split based on operation type
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink,
);

// This is the same cache you pass into new ApolloClient
const cache = new InMemoryCache();

const retryLink = new RetryLink();

// set up link state for local
const stateLink = withClientState({
  cache,
});

/**
 * Helper function to write fragment changes to cache
 * 
 * @param {object} client apollo client instance
 * @param {string} fragment gql fragment string 
 * @param {string} id id of the object without typename prefix
 * @param {string} __typename typename of the object in the cache
 * @param {data} data changes you want applied to object in cache
 */
export const writeFragment = ({ client, fragment, id, __typename, data }) => {
  try {
    const id = `${__typename}:${id}`
    const cache = client.readFragment({ fragment, id })
    const data = Object.assign({}, cache, data)
    client.writeFragment({ fragment, id, data })
  } catch (err) {
    console.log(err)
  }
}

export default new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) =>
          console.log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
          )
        );
      if (networkError) console.log(`[Network error]: ${networkError}`);
    }),
    retryLink,
    stateLink,
    httpWsLink
  ]),
  cache: cache,
  connectToDevTools: true
});