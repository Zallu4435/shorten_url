import { gql } from "@apollo/client";

// ─── Auth ─────────────────────────────────────────────────
export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      isAdmin
      isActive
      isVerified
      createdAt
    }
  }
`;

// ─── URLs ─────────────────────────────────────────────────
export const MY_URLS_QUERY = gql`
  query MyUrls($page: Int, $limit: Int) {
    myUrls(page: $page, limit: $limit) {
      urls {
        id
        slug
        shortUrl
        originalUrl
        title
        clickCount
        isActive
        isPrivate
        isSingleUse
        expiresAt
        createdAt
        qrCode
      }
      total
    }
  }
`;

export const GET_URL_QUERY = gql`
  query GetUrl($id: UUID!) {
    getUrl(id: $id) {
      id
      slug
      shortUrl
      originalUrl
      title
      description
      clickCount
      isActive
      isPrivate
      isSingleUse
      isFlagged
      flagReason
      maxClicks
      expiresAt
      activatesAt
      redirectRules
      webhookUrl
      qrCode
      isUrlReachable
      urlStatusCode
      lastCheckedAt
      createdAt
      updatedAt
    }
  }
`;

export const RESOLVE_SLUG_QUERY = gql`
  query ResolveSlug($slug: String!, $password: String) {
    resolveSlug(slug: $slug, password: $password) {
      redirectUrl
      requiresPassword
      isSingleUse
    }
  }
`;

// ─── Analytics ────────────────────────────────────────────
export const GET_ANALYTICS_QUERY = gql`
  query GetAnalytics($urlId: UUID!, $startDate: Date, $endDate: Date) {
    getAnalytics(urlId: $urlId, startDate: $startDate, endDate: $endDate) {
      totalClicks
      uniqueClicks
      clicksByDevice {
        deviceType
        count
      }
      clicksByCountry {
        country
        countryCode
        count
      }
      clicksByBrowser {
        browser
        count
      }
      clicksByOs {
        os
        count
      }
      clicksByDate {
        date
        count
      }
      clicksByReferrer {
        referrer
        count
      }
    }
  }
`;

export const CLICK_HISTORY_QUERY = gql`
  query ClickHistory($urlId: UUID!, $page: Int, $limit: Int) {
    clickHistory(urlId: $urlId, page: $page, limit: $limit) {
      clicks {
        id
        ipAddress
        country
        countryCode
        city
        deviceType
        browser
        os
        referrer
        isUnique
        createdAt
      }
      total
    }
  }
`;

export const MY_ANALYTICS_QUERY = gql`
  query MyAnalytics {
    myAnalytics {
      totalUrls
      totalClicks
      uniqueClicks
      clicksToday
      clicksThisWeek
      clicksThisMonth
      topUrls {
        id
        slug
        shortUrl
        title
        clickCount
      }
    }
  }
`;

// ─── Admin ────────────────────────────────────────────────
export const PLATFORM_STATS_QUERY = gql`
  query PlatformStats {
    platformStats {
      totalUsers
      activeUsers
      adminUsers
      newUsersToday
      newUsersThisWeek
      newUsersThisMonth
      totalUrls
      activeUrls
      flaggedUrls
      newUrlsToday
      newUrlsThisWeek
      newUrlsThisMonth
      totalClicks
      clicksToday
      clicksThisWeek
      clicksThisMonth
    }
  }
`;

export const ALL_USERS_QUERY = gql`
  query AllUsers($page: Int, $limit: Int, $search: String, $isActive: Boolean) {
    allUsers(page: $page, limit: $limit, search: $search, isActive: $isActive) {
      users {
        id
        email
        username
        isAdmin
        isActive
        isVerified
        createdAt
      }
      total
    }
  }
`;

export const USER_DETAIL_QUERY = gql`
  query UserDetail($userId: UUID!) {
    userDetail(userId: $userId) {
      user {
        id
        email
        username
        isAdmin
        isActive
        isVerified
        createdAt
      }
      urlCount
      totalClicks
      recentUrls {
        id
        slug
        originalUrl
        clickCount
        isActive
        createdAt
      }
    }
  }
`;

export const ALL_URLS_ADMIN_QUERY = gql`
  query AllUrlsAdmin($page: Int, $limit: Int, $search: String, $flaggedOnly: Boolean) {
    allUrls(page: $page, limit: $limit, search: $search, flaggedOnly: $flaggedOnly) {
      urls {
        id
        slug
        shortUrl
        originalUrl
        clickCount
        isActive
        isFlagged
        flagReason
        createdAt
        user {
          id
          email
          username
        }
      }
      total
    }
  }
`;

// ─── AI ──────────────────────────────────────────────────
export const SUGGEST_SLUGS_QUERY = gql`
  query SuggestSlugs($url: String!, $count: Int) {
    suggestSlugs(url: $url, count: $count) {
      slug
      reason
    }
  }
`;

export const GENERATE_URL_METADATA_QUERY = gql`
  query GenerateUrlMetadata($url: String!) {
    generateUrlMetadata(url: $url) {
      title
      description
    }
  }
`;

export const SUGGEST_REDIRECT_RULES_QUERY = gql`
  query SuggestRedirectRules($url: String!) {
    suggestRedirectRules(url: $url) {
      condition
      targetUrl
      description
    }
  }
`;
