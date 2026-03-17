package com.quizmaster.service;

import com.quizmaster.entity.PasswordResetToken;
import com.quizmaster.entity.User;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.repository.PasswordResetTokenRepository;
import com.quizmaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Generate a reset token and email the link to the user.
     * Silent failure if the email doesn't exist (prevent user enumeration).
     */
    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email.toLowerCase().trim()).ifPresent(user -> {
            String rawToken = UUID.randomUUID().toString();
            String tokenHash = AuthService.sha256(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                    .build();
            resetTokenRepository.save(resetToken);

            sendResetEmail(user, rawToken);
        });
    }

    /**
     * Validate the token and set a new password.
     */
    @Transactional
    public void confirmPasswordReset(String rawToken, String newPassword) {
        String tokenHash = AuthService.sha256(rawToken);

        PasswordResetToken resetToken = resetTokenRepository
                .findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid or already used reset token"));

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        resetTokenRepository.save(resetToken);
    }

    private void sendResetEmail(User user, String rawToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + rawToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("QuizMaster Pro — Reset Your Password");
        message.setText(
                "Hi " + user.getFullName() + ",\n\n"
                        + "You requested a password reset. Click the link below to set a new password:\n\n"
                        + resetLink + "\n\n"
                        + "This link expires in 1 hour.\n\n"
                        + "If you didn't request this, please ignore this email.\n\n"
                        + "— QuizMaster Pro");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
        }
    }
}
