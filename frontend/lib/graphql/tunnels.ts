import { gql } from "@apollo/client";

// ─── Fragments ────────────────────────────────────────────────

export const TUNNEL_FIELDS = gql`
  fragment TunnelFields on TunnelType {
    id
    alias
    status
    localPort
    isActive
    publicUrl
    isConnected
    lastConnectedAt
    createdAt
    updatedAt
  }
`;

// ─── Queries ──────────────────────────────────────────────────

export const MY_TUNNELS_QUERY = gql`
  ${TUNNEL_FIELDS}
  query MyTunnels($search: String, $status: String) {
    myTunnels(search: $search, status: $status) {
      ...TunnelFields
    }
  }
`;

export const GET_TUNNEL_QUERY = gql`
  ${TUNNEL_FIELDS}
  query GetTunnel($id: UUID!) {
    getTunnel(id: $id) {
      ...TunnelFields
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────

export const CREATE_TUNNEL_MUTATION = gql`
  mutation CreateTunnel($alias: String!, $localPort: Int) {
    createTunnel(alias: $alias, localPort: $localPort) {
      tunnel {
        id
        alias
        status
        localPort
        publicUrl
        createdAt
      }
      rawToken
      tokenHint
      agentCommand
      error
    }
  }
`;

export const DELETE_TUNNEL_MUTATION = gql`
  mutation DeleteTunnel($id: UUID!) {
    deleteTunnel(id: $id) {
      success
      error
    }
  }
`;

export const REGENERATE_TOKEN_MUTATION = gql`
  mutation RegenerateTunnelToken($id: UUID!) {
    regenerateTunnelToken(id: $id) {
      rawToken
      tokenHint
      agentCommand
      error
    }
  }
`;

export const UPDATE_TUNNEL_MUTATION = gql`
  mutation UpdateTunnel($id: UUID!, $isActive: Boolean) {
    updateTunnel(id: $id, isActive: $isActive) {
      success
      error
      tunnel {
        id
        isActive
      }
    }
  }
`;
