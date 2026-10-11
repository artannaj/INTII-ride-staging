package com.carpooling.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String fromAddress
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    /**
     * Sends the signup OTP. Always prints the OTP to the console (dev/demo reliability),
     * and also attempts to send a real email. If the email send fails, it logs the error
     * but does NOT throw — the OTP is still available in the console.
     */
    public void sendSignupOtp(String toEmail, String otp) {
        // ============ DEV LOG (always prints, safe fallback) ============
        System.out.println("=================================================");
        System.out.println("🔑 OTP for " + toEmail + " = " + otp);
        System.out.println("=================================================");
        // ================================================================

        // ============ REAL EMAIL (best-effort, fails gracefully) ============
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("INTI Ride — your verification code");
            message.setText(
                    """
                    Your INTI Ride verification code is:

                    %s

                    This code expires in 10 minutes. If you did not sign up, ignore this email.
                    """.formatted(otp)
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("⚠️  Email send failed (dev env OK): " + e.getMessage());
        }
        // ====================================================================
    }

    /**
     * Sends the password reset OTP. Same pattern: always print to console,
     * also try to send a real email, fail gracefully.
     */
    public void sendPasswordResetOtp(String toEmail, String otp) {
        // ============ DEV LOG (always prints, safe fallback) ============
        System.out.println("=================================================");
        System.out.println("🔑 RESET OTP for " + toEmail + " = " + otp);
        System.out.println("=================================================");
        // ================================================================

        // ============ REAL EMAIL (best-effort, fails gracefully) ============
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("INTI Ride — your password reset code");
            message.setText(
                    """
                    Your INTI Ride password reset code is:

                    %s

                    This code expires in 10 minutes. If you did not request a password reset, ignore this email.
                    """.formatted(otp)
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("⚠️  Reset email send failed (dev env OK): " + e.getMessage());
        }
        // ====================================================================
    }
}