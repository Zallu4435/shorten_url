"""
User GraphQL Mutations
  - Register      : Create a new account → returns tokens + user
  - Login         : Authenticate → returns tokens + user
  - RefreshToken  : Rotate refresh token → returns new tokens
  - Logout        : Revoke refresh token
"""

import graphene

from apps.users.graphql.types import AuthPayloadType, TokenRefreshPayloadType, MessageType
from apps.users import services


# ─────────────────────────────────────────────
# Register
# ─────────────────────────────────────────────

class Register(graphene.Mutation):
    """
    Create a new user account.

    Example:
        mutation {
            register(email: "user@example.com", username: "john_doe", password: "SecurePass1") {
                accessToken
                refreshToken
                user {
                    id
                    email
                    username
                }
            }
        }
    """

    class Arguments:
        email = graphene.String(required=True, description="Valid email address.")
        username = graphene.String(required=True, description="Unique display name (3–50 chars).")
        password = graphene.String(required=True, description="Password (min 8 chars, must contain upper, lower, digit).")

    Output = AuthPayloadType

    @classmethod
    def mutate(cls, root, info, email: str, username: str, password: str):
        result = services.register_user(
            email=email,
            username=username,
            password=password,
        )
        return AuthPayloadType(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            user=result["user"],
        )


# ─────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────

class Login(graphene.Mutation):
    """
    Log in with email and password. Returns JWT tokens and user profile.

    Example:
        mutation {
            login(email: "user@example.com", password: "SecurePass1") {
                accessToken
                refreshToken
                user { id, email, username, isAdmin }
            }
        }
    """

    class Arguments:
        email = graphene.String(required=True, description="Your registered email address.")
        password = graphene.String(required=True, description="Your account password.")

    Output = AuthPayloadType

    @classmethod
    def mutate(cls, root, info, email: str, password: str):
        result = services.login_user(email=email, password=password)
        return AuthPayloadType(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            user=result["user"],
        )


# ─────────────────────────────────────────────
# Refresh Token
# ─────────────────────────────────────────────

class RefreshToken(graphene.Mutation):
    """
    Exchange a (still-valid) refresh token for a new access token + new refresh token.
    The old refresh token is immediately revoked (token rotation).

    Example:
        mutation {
            refreshToken(refreshToken: "<your-refresh-token>") {
                accessToken
                refreshToken
            }
        }
    """

    class Arguments:
        refresh_token = graphene.String(
            required=True,
            description="The refresh token received from login or register."
        )

    Output = TokenRefreshPayloadType

    @classmethod
    def mutate(cls, root, info, refresh_token: str):
        result = services.refresh_tokens(raw_refresh_token=refresh_token)
        return TokenRefreshPayloadType(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
        )


# ─────────────────────────────────────────────
# Logout
# ─────────────────────────────────────────────

class Logout(graphene.Mutation):
    """
    Revoke the given refresh token, invalidating the user's session.
    The access token will expire naturally after 15 minutes.

    Example:
        mutation {
            logout(refreshToken: "<your-refresh-token>") {
                success
                message
            }
        }
    """

    class Arguments:
        refresh_token = graphene.String(
            required=True,
            description="The refresh token to invalidate."
        )

    Output = MessageType

    @classmethod
    def mutate(cls, root, info, refresh_token: str):
        services.logout_user(raw_refresh_token=refresh_token)
        return MessageType(
            success=True,
            message="You have been logged out successfully."
        )


# ─────────────────────────────────────────────
# Update Profile
# ─────────────────────────────────────────────

class UpdateProfile(graphene.Mutation):
    """
    Update the authenticated user's email or username.
    """

    class Arguments:
        email = graphene.String(description="New email address.")
        username = graphene.String(description="New display name.")

    user = graphene.Field("apps.users.graphql.types.UserType")

    @classmethod
    def mutate(cls, root, info, email: str = None, username: str = None):
        user = info.context.user
        if not user or not user.is_authenticated:
            from shared.exceptions import AuthenticationError
            raise AuthenticationError()

        updated_user = services.update_user_profile(
            user=user,
            email=email,
            username=username
        )
        return UpdateProfile(user=updated_user)


# ─────────────────────────────────────────────
# Change Password
# ─────────────────────────────────────────────

class ChangePassword(graphene.Mutation):
    """
    Change the authenticated user's password.
    """

    class Arguments:
        old_password = graphene.String(required=True)
        new_password = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, old_password: str, new_password: str):
        user = info.context.user
        if not user or not user.is_authenticated:
            from shared.exceptions import AuthenticationError
            raise AuthenticationError()

        services.change_password(
            user=user,
            old_password=old_password,
            new_password=new_password
        )
        return ChangePassword(
            success=True,
            message="Password updated successfully. Please log in again."
        )


# ─────────────────────────────────────────────
# Delete Account
# ─────────────────────────────────────────────

class DeleteAccount(graphene.Mutation):
    """
    Permanently deactivate the authenticated user's account.
    """

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info):
        user = info.context.user
        if not user or not user.is_authenticated:
            from shared.exceptions import AuthenticationError
            raise AuthenticationError()

        services.delete_user_account(user)
        return DeleteAccount(
            success=True, 
            message="Your account has been deactivated."
        )


# ─────────────────────────────────────────────
# Mutation Root
# ─────────────────────────────────────────────

class UserMutation(graphene.ObjectType):
    register = Register.Field(description="Create a new user account.")
    login = Login.Field(description="Log in with email and password.")
    refresh_token = RefreshToken.Field(description="Refresh your JWT access token.")
    logout = Logout.Field(description="Log out and revoke your refresh token.")
    
    # Account Management
    update_profile = UpdateProfile.Field(description="Update profile information.")
    change_password = ChangePassword.Field(description="Security: Change password.")
    delete_account = DeleteAccount.Field(description="Danger: Permanently deactivate account.")
