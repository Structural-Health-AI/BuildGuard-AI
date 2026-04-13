"""
Email service for sending verification and password reset emails
Supports Gmail, SendGrid, and generic SMTP servers
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    """Send transactional emails via SMTP"""

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        plain_text: Optional[str] = None
    ) -> bool:
        """
        Send email via SMTP

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML body
            plain_text: Plain text fallback

        Returns:
            True if sent successfully, False otherwise
        """
        if not settings.smtp_server or not settings.smtp_user:
            logger.warning(
                "Email not sent - SMTP not configured. "
                "Set SMTP_SERVER and SMTP_USER in .env"
            )
            return False

        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.sender_name} <{settings.sender_email}>"
            message["To"] = to_email

            # Attach plain text version
            if plain_text:
                message.attach(MIMEText(plain_text, "plain"))
            else:
                message.attach(MIMEText("See HTML version", "plain"))

            # Attach HTML version
            message.attach(MIMEText(html_content, "html"))

            # Send email
            async with aiosmtplib.SMTP(
                hostname=settings.smtp_server,
                port=settings.smtp_port,
                use_tls=True
            ) as smtp:
                await smtp.login(settings.smtp_user, settings.smtp_password)
                await smtp.send_message(message)

            logger.info(f"Email sent to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @staticmethod
    async def send_email_verification(
        to_email: str,
        verification_link: str,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Send email verification link

        Args:
            to_email: Recipient email
            verification_link: Full verification URL
            user_name: User's name for personalization

        Returns:
            Success status
        """
        subject = "Verify Your BuildGuard-AI Email"
        name = user_name or to_email.split("@")[0]

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc3545;">Email Verification Required</h2>

                    <p>Hi {name},</p>

                    <p>Thank you for signing up for BuildGuard-AI!
                    Please verify your email address to complete your registration.</p>

                    <p>
                        <a href="{verification_link}"
                           style="display: inline-block; background-color: #007bff;
                                  color: white; padding: 10px 20px;
                                  text-decoration: none; border-radius: 5px;">
                            Verify Email Address
                        </a>
                    </p>

                    <p>Or copy this link: <br/>
                    <code style="background-color: #f4f4f4; padding: 5px;">{verification_link}</code>
                    </p>

                    <p style="font-size: 12px; color: #666;">
                        This link expires in 48 hours for security reasons.
                    </p>

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

                    <p style="font-size: 12px; color: #666;">
                        If you didn't sign up for this account, please ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """

        plain_text = f"""
        Email Verification Required

        Hi {name},

        Thank you for signing up for BuildGuard-AI!
        Please verify your email address to complete your registration.

        Click this link: {verification_link}

        This link expires in 48 hours for security reasons.

        If you didn't sign up for this account, please ignore this email.
        """

        return await EmailService.send_email(to_email, subject, html_content, plain_text)

    @staticmethod
    async def send_password_reset(
        to_email: str,
        reset_link: str,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Send password reset link

        Args:
            to_email: Recipient email
            reset_link: Full password reset URL
            user_name: User's name for personalization

        Returns:
            Success status
        """
        subject = "Reset Your BuildGuard-AI Password"
        name = user_name or to_email.split("@")[0]

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc3545;">Password Reset Request</h2>

                    <p>Hi {name},</p>

                    <p>We received a request to reset your BuildGuard-AI password.
                    Click the link below to set a new password:</p>

                    <p>
                        <a href="{reset_link}"
                           style="display: inline-block; background-color: #007bff;
                                  color: white; padding: 10px 20px;
                                  text-decoration: none; border-radius: 5px;">
                            Reset Password
                        </a>
                    </p>

                    <p>Or copy this link: <br/>
                    <code style="background-color: #f4f4f4; padding: 5px;">{reset_link}</code>
                    </p>

                    <p style="font-size: 12px; color: #666;">
                        This link expires in 24 hours for security reasons.
                    </p>

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

                    <p style="font-size: 12px; color: #666;">
                        If you didn't request a password reset, please ignore this email
                        and your password will remain unchanged. Your account is secure.
                    </p>
                </div>
            </body>
        </html>
        """

        plain_text = f"""
        Password Reset Request

        Hi {name},

        We received a request to reset your BuildGuard-AI password.
        Click the link below to set a new password:

        {reset_link}

        This link expires in 24 hours for security reasons.

        If you didn't request a password reset, please ignore this email
        and your password will remain unchanged. Your account is secure.
        """

        return await EmailService.send_email(to_email, subject, html_content, plain_text)

    @staticmethod
    async def send_password_changed_notification(
        to_email: str,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Send password change confirmation email

        Args:
            to_email: Recipient email
            user_name: User's name for personalization

        Returns:
            Success status
        """
        subject = "Your Password Has Been Changed"
        name = user_name or to_email.split("@")[0]

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #28a745;">Password Changed Successfully</h2>

                    <p>Hi {name},</p>

                    <p>Your BuildGuard-AI password has been successfully changed.</p>

                    <p style="font-size: 12px; color: #666;">
                        If you didn't make this change, please contact support immediately
                        at support@buildguard-ai.com
                    </p>
                </div>
            </body>
        </html>
        """

        plain_text = f"""
        Password Changed Successfully

        Hi {name},

        Your BuildGuard-AI password has been successfully changed.

        If you didn't make this change, please contact support immediately
        at support@buildguard-ai.com
        """

        return await EmailService.send_email(to_email, subject, html_content, plain_text)
