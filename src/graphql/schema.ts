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
    type: String!       # checking | savings | credit (we’ll tighten this later)
    balanceCents: Int!
    createdAt: String!
  }

  """Input required to create a user"""
  input CreateUserInput {
    email: String!
    name: String!
  }

  type Query {
    health: String!
    users: [User!]!
    accountsByUser(userId: ID!): [Account!]!
  }

  type Mutation {
    noop: Boolean!
    createUser(input: CreateUserInput!): User!
  }
`;
