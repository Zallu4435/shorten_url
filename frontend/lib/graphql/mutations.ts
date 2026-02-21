import { gql } from "@apollo/client";

// ─── Auth ─────────────────────────────────────────────────
export const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $username: String!, $password: String!) {
    register(email: $email, username: $username, password: $password) {
      accessToken
      refreshToken
      user {
        id
        email
        username
        isAdmin
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        email
        username
        isAdmin
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      success
      message
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($email: String, $username: String) {
    updateProfile(email: $email, username: $username) {
      user {
        id
        email
        username
      }
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount {
    deleteAccount {
      success
      message
    }
  }
`;

// ─── URLs ─────────────────────────────────────────────────
export const CREATE_SHORT_URL_MUTATION = gql`
  mutation CreateShortUrl(
    $originalUrl: String!
    $slug: String
    $title: String
    $description: String
    $isPrivate: Boolean
    $password: String
    $isSingleUse: Boolean
    $maxClicks: Int
    $expiresAt: DateTime
    $activatesAt: DateTime
    $webhookUrl: String
    $redirectRules: JSONString
    $qrEnabled: Boolean
  ) {
    createShortUrl(
      originalUrl: $originalUrl
      slug: $slug
      title: $title
      description: $description
      isPrivate: $isPrivate
      password: $password
      isSingleUse: $isSingleUse
      maxClicks: $maxClicks
      expiresAt: $expiresAt
      activatesAt: $activatesAt
      webhookUrl: $webhookUrl
      redirectRules: $redirectRules
      qrEnabled: $qrEnabled
    ) {
      id
      slug
      shortUrl
      originalUrl
      title
      qrEnabled
      qrCodeUrl
      createdAt
    }
  }
`;

export const UPDATE_SHORT_URL_MUTATION = gql`
  mutation UpdateShortUrl(
    $id: UUID!
    $originalUrl: String
    $slug: String
    $title: String
    $description: String
    $isActive: Boolean
    $isPrivate: Boolean
    $password: String
    $maxClicks: Int
    $expiresAt: DateTime
    $activatesAt: DateTime
    $webhookUrl: String
    $redirectRules: JSONString
    $qrEnabled: Boolean
  ) {
    updateShortUrl(
      id: $id
      originalUrl: $originalUrl
      slug: $slug
      title: $title
      description: $description
      isActive: $isActive
      isPrivate: $isPrivate
      password: $password
      maxClicks: $maxClicks
      expiresAt: $expiresAt
      activatesAt: $activatesAt
      webhookUrl: $webhookUrl
      redirectRules: $redirectRules
      qrEnabled: $qrEnabled
    ) {
      id
      slug
      shortUrl
      originalUrl
      title
      isActive
      isPrivate
      isSingleUse
      maxClicks
      expiresAt
      activatesAt
      webhookUrl
      qrEnabled
      qrCodeUrl
      updatedAt
    }
  }
`;

export const DELETE_SHORT_URL_MUTATION = gql`
  mutation DeleteShortUrl($id: UUID!) {
    deleteShortUrl(id: $id) {
      success
      message
    }
  }
`;

// ─── Admin — User Management ──────────────────────────────
export const ACTIVATE_USER_MUTATION = gql`
  mutation ActivateUser($userId: UUID!) {
    activateUser(userId: $userId) {
      id
      isActive
    }
  }
`;

export const DEACTIVATE_USER_MUTATION = gql`
  mutation DeactivateUser($userId: UUID!) {
    deactivateUser(userId: $userId) {
      id
      isActive
    }
  }
`;

export const MAKE_ADMIN_MUTATION = gql`
  mutation MakeAdmin($userId: UUID!) {
    makeAdmin(userId: $userId) {
      id
      isAdmin
    }
  }
`;

export const REMOVE_ADMIN_MUTATION = gql`
  mutation RemoveAdmin($userId: UUID!) {
    removeAdmin(userId: $userId) {
      id
      isAdmin
    }
  }
`;

export const ADMIN_DELETE_USER_MUTATION = gql`
  mutation AdminDeleteUser($userId: UUID!) {
    adminDeleteUser(userId: $userId) {
      success
      message
    }
  }
`;

// ─── Admin — URL Management ───────────────────────────────
export const FLAG_URL_MUTATION = gql`
  mutation FlagUrl($urlId: UUID!, $reason: String!) {
    flagUrl(urlId: $urlId, reason: $reason) {
      id
      isFlagged
      flagReason
      isActive
    }
  }
`;

export const UNFLAG_URL_MUTATION = gql`
  mutation UnflagUrl($urlId: UUID!) {
    unflagUrl(urlId: $urlId) {
      id
      isFlagged
      isActive
    }
  }
`;

export const ADMIN_ACTIVATE_URL_MUTATION = gql`
  mutation AdminActivateUrl($urlId: UUID!) {
    adminActivateUrl(urlId: $urlId) {
      id
      isActive
    }
  }
`;

export const ADMIN_DEACTIVATE_URL_MUTATION = gql`
  mutation AdminDeactivateUrl($urlId: UUID!) {
    adminDeactivateUrl(urlId: $urlId) {
      id
      isActive
    }
  }
`;

export const ADMIN_DELETE_URL_MUTATION = gql`
  mutation AdminDeleteUrl($urlId: UUID!) {
    adminDeleteUrl(urlId: $urlId) {
      success
      message
    }
  }
`;
