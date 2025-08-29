// Apollo Server (standalone) for local dev
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function main() {
  const server = new ApolloServer({ typeDefs, resolvers });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 }
  });

  console.log(`🚀 GraphQL server ready at ${url}`);
}

main().catch(err => {
  console.error("Failed to start GraphQL server:", err);
  process.exit(1);
});
