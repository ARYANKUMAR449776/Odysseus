// GraphQL type definitions (schema)
// - Query: read operations (no side-effects)
// - Mutation: write operations (create/update/delete)

export const typeDefs = /* GraphQL */ `
  """A user in Odysseus"""
  type User {
    id: ID!
    email: String!
    name: String!
    createdAt: String!
  }

  """Bank account owned by a user"""
  type Account {
    id: ID!
    userId: ID!
    type: String!       # checking | savings | credit (tighten this later)
    balanceCents: Int!
    createdAt: String!
  }

  type Query {
    health: String!                     # quick sanity check
    users: [User!]!                     # list all users (demo / in-memory)
    accountsByUser(userId: ID!): [Account!]!
  }

  type Mutation {
    noop: Boolean!                      # placeholder;
  }
`;
