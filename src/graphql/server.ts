import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { ensureDbIndexes } from '../db.setup';

async function main() {
  await ensureDbIndexes();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    includeStacktraceInErrorResponses: true,
  });

  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
  console.log(`🚀 GraphQL server ready at ${url}`);
}

main().catch(err => {
  console.error("Failed to start GraphQL server:", err);
  process.exit(1);
});
