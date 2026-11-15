package com.newtin.eco.service;

import com.newtin.eco.event.AccountMailEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}") private String frontendUrl;
    @Value("${app.mail.from}")    private String from;

    // Default phase is AFTER_COMMIT: a rolled-back registration never sends mail.
    // fallbackExecution: still send if someone publishes outside a transaction.
    @Async
    @TransactionalEventListener(fallbackExecution = true)
    public void onAccountMail(AccountMailEvent e) {
        switch (e.type()) {
            case VERIFY_EMAIL -> send(e.to(), "Verify your email",
                    "Hi " + e.firstName() + ",\n\nConfirm your email address:\n"
                            + frontendUrl + "/verify-email?token=" + e.token()
                            + "\n\nThis link expires in 24 hours. If you didn't create an account, ignore this email.");
            case RESET_PASSWORD -> send(e.to(), "Reset your password",
                    "Hi " + e.firstName() + ",\n\nReset your password:\n"
                            + frontendUrl + "/reset-password?token=" + e.token()
                            + "\n\nThis link expires in 30 minutes. If you didn't request it, ignore this email.");
        }
    }

    private void send(String to, String subject, String text) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
        } catch (Exception ex) {
            log.error("Failed to send '{}' email", subject, ex);
        }
    }
}